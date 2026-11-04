"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");

async function analyze() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "wanderlust_norm",
  });

  console.log("=== HYPOTHESIS & INTEGRITY DATA TESTS ===");

  // H1: location -> country test
  const [h1] = await conn.query(`
    SELECT location, COUNT(DISTINCT country) AS n, GROUP_CONCAT(DISTINCT country) AS countries
    FROM listings GROUP BY location HAVING n > 1
  `);
  console.log("H1 (location -> country violations):", h1);

  // Redundancy in listings (location, country)
  const [locCountryDupes] = await conn.query(`
    SELECT location, country, COUNT(*) as cnt
    FROM listings GROUP BY location, country HAVING cnt > 1 ORDER BY cnt DESC LIMIT 10
  `);
  console.log("Listings repeating (location, country):", locCountryDupes);

  // Inconsistent casing/spelling in location/country
  const [locCasing] = await conn.query(`
    SELECT LOWER(TRIM(location)) AS norm, COUNT(DISTINCT location) AS variants, GROUP_CONCAT(DISTINCT location) AS examples
    FROM listings GROUP BY norm HAVING variants > 1
  `);
  console.log("Location spelling variants:", locCasing);

  const [countryCasing] = await conn.query(`
    SELECT LOWER(TRIM(country)) AS norm, COUNT(DISTINCT country) AS variants, GROUP_CONCAT(DISTINCT country) AS examples
    FROM listings GROUP BY norm HAVING variants > 1
  `);
  console.log("Country spelling variants:", countryCasing);

  // H2: location -> coordinates test
  const [h2] = await conn.query(`
    SELECT location, COUNT(DISTINCT CONCAT(COALESCE(latitude,''), ',', COALESCE(longitude,''))) as n
    FROM listings GROUP BY location HAVING n > 1
  `);
  console.log("H2 (location -> coordinates violations):", h2);

  // H3: owner_profile business_type distinct values
  const [h3] = await conn.query(`
    SELECT business_type, COUNT(*) as cnt FROM owner_profile GROUP BY business_type
  `);
  console.log("H3 (business_type counts):", h3);

  // H4: owner_profile status and rejection reason
  const [h4] = await conn.query(`
    SELECT verification_status, rejection_reason, verification_note, COUNT(*) as cnt
    FROM owner_profile GROUP BY verification_status, rejection_reason, verification_note
  `);
  console.log("H4 (status/reason distribution):", h4);

  // H5: duplicated username/email in owner_profile
  const [opCols] = await conn.query(`
    SELECT COLUMN_NAME FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'owner_profile'
  `);
  console.log("Owner_profile columns:", opCols.map(c => c.COLUMN_NAME));

  // H6: users profile picture
  const [uPic] = await conn.query(`
    SELECT user_id, profile_picture_url, profile_picture_public_id
    FROM users WHERE profile_picture_url IS NOT NULL LIMIT 5
  `);
  console.log("Users with profile pic:", uPic);

  // H7: Subtype integrity: any owner_profile whose user is NOT owner?
  const [h7] = await conn.query(`
    SELECT op.owner_id, u.role
    FROM owner_profile op
    JOIN users u ON op.owner_id = u.user_id
    WHERE u.role <> 'owner'
  `);
  console.log("H7 (owner_profile with non-owner role):", h7);

  // Users with role='owner' without owner_profile
  const [ownersWithoutProfile] = await conn.query(`
    SELECT u.user_id, u.username, u.role
    FROM users u
    LEFT JOIN owner_profile op ON u.user_id = op.owner_id
    WHERE u.role = 'owner' AND op.owner_id IS NULL
  `);
  console.log("Users with role='owner' lacking owner_profile:", ownersWithoutProfile);

  // H8: Reviews: multiple reviews per user per listing?
  const [h8] = await conn.query(`
    SELECT listing_id, user_id, COUNT(*) as cnt
    FROM reviews GROUP BY listing_id, user_id HAVING cnt > 1
  `);
  console.log("H8 (duplicate reviews per user per listing):", h8);

  // H9: Wishlists: duplicate (user_id, listing_id)?
  const [h9] = await conn.query(`
    SELECT user_id, listing_id, COUNT(*) as cnt
    FROM wishlists GROUP BY user_id, listing_id HAVING cnt > 1
  `);
  console.log("H9 (duplicate wishlists):", h9);

  // H11: documents JSON in owner_profile (1NF atomicity test)
  const [h11] = await conn.query(`
    SELECT owner_id, documents FROM owner_profile WHERE documents IS NOT NULL
  `);
  console.log("H11 (documents in owner_profile):", JSON.stringify(h11, null, 2));

  // Orphan scans (R2)
  const [orphanListings] = await conn.query(`
    SELECT l.listing_id, l.owner_id FROM listings l LEFT JOIN users u ON l.owner_id = u.user_id WHERE u.user_id IS NULL
  `);
  console.log("Orphan listings:", orphanListings);

  const [orphanReviewsListing] = await conn.query(`
    SELECT r.review_id, r.listing_id FROM reviews r LEFT JOIN listings l ON r.listing_id = l.listing_id WHERE l.listing_id IS NULL
  `);
  console.log("Orphan reviews (listing):", orphanReviewsListing);

  const [orphanReviewsUser] = await conn.query(`
    SELECT r.review_id, r.user_id FROM reviews r LEFT JOIN users u ON r.user_id = u.user_id WHERE u.user_id IS NULL
  `);
  console.log("Orphan reviews (user):", orphanReviewsUser);

  const [orphanWishlistListing] = await conn.query(`
    SELECT w.id, w.listing_id FROM wishlists w LEFT JOIN listings l ON w.listing_id = l.listing_id WHERE l.listing_id IS NULL
  `);
  console.log("Orphan wishlists (listing):", orphanWishlistListing);

  const [orphanWishlistUser] = await conn.query(`
    SELECT w.id, w.user_id FROM wishlists w LEFT JOIN users u ON w.user_id = u.user_id WHERE u.user_id IS NULL
  `);
  console.log("Orphan wishlists (user):", orphanWishlistUser);

  const [orphanOwnerProfile] = await conn.query(`
    SELECT op.owner_id FROM owner_profile op LEFT JOIN users u ON op.owner_id = u.user_id WHERE u.user_id IS NULL
  `);
  console.log("Orphan owner profiles:", orphanOwnerProfile);

  await conn.end();
}

analyze().catch(console.error);

