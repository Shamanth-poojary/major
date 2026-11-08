/**
 * db/seed/backfillRoomTypes.js
 * Idempotent room type generator & backfill script for existing listings.
 *
 * Usage:
 *   node db/seed/backfillRoomTypes.js          (Dry-run preview)
 *   node db/seed/backfillRoomTypes.js --apply  (Execute database transaction)
 */

"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const mysql = require("mysql2/promise");
const {
  classifyListing,
  generateRoomTypes,
  getDefaultPaymentPolicy,
} = require("../../services/roomGenerator");

async function run() {
  const isApply = process.argv.includes("--apply");
  const dbName = process.env.DB_NAME || "wanderlust";

  console.log(`\n======================================================`);
  console.log(` WanderLust: Room Types & Payment Policy Backfill`);
  console.log(` Database: ${dbName} | Mode: ${isApply ? "LIVE (APPLY)" : "DRY-RUN (PREVIEW ONLY)"}`);
  console.log(`======================================================\n`);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName,
    multipleStatements: true,
  });

  try {
    // 1. Fetch all lookup amenities
    const [amenityRows] = await conn.query("SELECT id, name FROM amenities");
    const amenityMap = new Map();
    for (const row of amenityRows) {
      amenityMap.set(row.name.toLowerCase().trim(), row.id);
    }

    // 2. Query listings with owner profile
    const [listings] = await conn.query(`
      SELECT l.listing_id, l.title, l.description, l.price, l.location, l.country,
             l.image_url, l.image_filename, op.business_type
      FROM listings l
      LEFT JOIN owner_profile op ON op.owner_id = l.owner_id
      ORDER BY l.listing_id ASC
    `);

    // 3. Find which listings already have room types or payment policies
    const [existingRoomListings] = await conn.query(`
      SELECT DISTINCT listing_id FROM room_types
    `);
    const existingRoomIds = new Set(existingRoomListings.map((r) => r.listing_id));

    const [existingPolicyListings] = await conn.query(`
      SELECT DISTINCT listing_id FROM listing_payment_policy
    `);
    const existingPolicyIds = new Set(existingPolicyListings.map((r) => r.listing_id));

    let processedCount = 0;
    let skippedCount = 0;
    let totalRoomsCreated = 0;
    let totalPoliciesCreated = 0;

    const previewListings = [];

    if (isApply) {
      await conn.beginTransaction();
    }

    for (const listing of listings) {
      const lid = listing.listing_id;
      const hasRooms = existingRoomIds.has(lid);
      const hasPolicy = existingPolicyIds.has(lid);

      if (hasRooms && hasPolicy) {
        skippedCount++;
        continue;
      }

      processedCount++;
      const category = classifyListing(listing);
      const rooms = hasRooms ? [] : generateRoomTypes(listing);
      const policy = hasPolicy ? null : getDefaultPaymentPolicy();

      if (!isApply) {
        previewListings.push({
          id: lid,
          title: listing.title,
          category,
          basePrice: Number(listing.price),
          rooms: rooms.map((r) => ({
            name: r.name,
            category: r.category,
            units: r.total_units,
            maxGuests: r.max_guests,
            price: r.price_per_night,
            amenitiesCount: r.amenities.length,
          })),
          policy: policy ? `${policy.advance_value}% advance (${policy.advance_type})` : "Pre-existing",
        });
      } else {
        // Apply: Insert Payment Policy if missing
        if (!hasPolicy) {
          await conn.query(
            `INSERT INTO listing_payment_policy (listing_id, allow_advance, advance_type, advance_value)
             VALUES (?, ?, ?, ?)`,
            [lid, policy.allow_advance, policy.advance_type, policy.advance_value]
          );
          totalPoliciesCreated++;
        }

        // Apply: Insert Room Types, Amenities, and Images if missing
        if (!hasRooms) {
          for (const room of rooms) {
            const [roomRes] = await conn.query(
              `INSERT INTO room_types
                (listing_id, name, description, category, bed_config, size_sqft, max_guests, price_per_night, total_units, is_active, is_auto_generated)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE)`,
              [
                lid,
                room.name,
                room.description,
                room.category,
                room.bed_config,
                room.size_sqft,
                room.max_guests,
                room.price_per_night,
                room.total_units,
              ]
            );
            const roomTypeId = roomRes.insertId;
            totalRoomsCreated++;

            // Link Amenities
            for (const aName of room.amenities) {
              const aid = amenityMap.get(aName.toLowerCase().trim());
              if (aid) {
                await conn.query(
                  `INSERT IGNORE INTO room_type_amenities (room_type_id, amenity_id) VALUES (?, ?)`,
                  [roomTypeId, aid]
                );
              }
            }

            // Link Listing Image as room fallback
            if (listing.image_url) {
              await conn.query(
                `INSERT INTO room_type_images (room_type_id, url, public_id, sort_order)
                 VALUES (?, ?, ?, 0)`,
                [roomTypeId, listing.image_url, listing.image_filename || null]
              );
            }
          }
        }
      }
    }

    if (isApply) {
      await conn.commit();
      console.log(`\n Transaction committed successfully!`);
      console.log(`   - Listings evaluated: ${listings.length}`);
      console.log(`   - Listings modified:  ${processedCount}`);
      console.log(`   - Listings skipped:   ${skippedCount} (already populated)`);
      console.log(`   - Room Types created: ${totalRoomsCreated}`);
      console.log(`   - Policies created:   ${totalPoliciesCreated}`);

      // Integrity verification check: any listings without rooms or policy?
      const [missingRooms] = await conn.query(`
        SELECT l.listing_id, l.title FROM listings l
        LEFT JOIN room_types rt ON rt.listing_id = l.listing_id AND rt.is_active = TRUE
        WHERE rt.id IS NULL
      `);
      const [missingPolicies] = await conn.query(`
        SELECT l.listing_id, l.title FROM listings l
        LEFT JOIN listing_payment_policy lpp ON lpp.listing_id = l.listing_id
        WHERE lpp.listing_id IS NULL
      `);

      console.log(`\nIntegrity Verification:`);
      console.log(`   - Listings lacking active room types: ${missingRooms.length}`);
      console.log(`   - Listings lacking payment policy:    ${missingPolicies.length}`);

      if (missingRooms.length === 0 && missingPolicies.length === 0) {
        console.log(` SUCCESS: 100% of catalogue listings are now bookable with active rooms & policies!\n`);
      } else {
        console.warn(` WARNING: Some listings still lack rooms or policies.`);
      }
    } else {
      console.log(`DRY-RUN SUMMARY (Sample of 6 listings out of ${previewListings.length}):\n`);
      const sample = previewListings.slice(0, 6);
      for (const item of sample) {
        console.log(`[Listing #${item.id}] "${item.title}"`);
        console.log(`  Category: ${item.category} | Base Listing Price: ₹${item.basePrice.toLocaleString("en-IN")}`);
        console.log(`  Payment Policy: ${item.policy}`);
        console.log(`  Proposed Rooms (${item.rooms.length}):`);
        item.rooms.forEach((r, idx) => {
          console.log(`    ${idx + 1}. ${r.name} (${r.category}) - ₹${r.price.toLocaleString("en-IN")}/night | Capacity: ${r.maxGuests} guests | Units: ${r.units} | Amenities: ${r.amenitiesCount}`);
        });
        console.log(``);
      }
      console.log(`Total listings to populate: ${previewListings.length}`);
      console.log(`Total listings skipped: ${skippedCount}`);
      console.log(`\nTo write to database, execute: npm run seed:rooms -- --apply\n`);
    }
  } catch (err) {
    if (isApply) {
      await conn.rollback();
    }
    console.error("Backfill operation failed:", err);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

run();
