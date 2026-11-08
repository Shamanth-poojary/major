/**
 * services/roomService.js
 * Room management service with inventory guards, unit-reduction checks,
 * soft deletes, and payment policy configuration.
 */

"use strict";

const pool = require("../db/pool");

/**
 * Fetch all rooms for a listing (including inactive ones if for owner management).
 */
async function getRoomsByListing(listingId, includeInactive = false) {
  try {
    const activeClause = includeInactive ? "" : "AND rt.is_active = TRUE";
    const [rooms] = await pool.query(
      `SELECT rt.*,
              GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ';;') AS amenities_list,
              (SELECT url FROM room_type_images rti WHERE rti.room_type_id = rt.id ORDER BY rti.sort_order ASC, rti.id ASC LIMIT 1) AS image_url
       FROM room_types rt
       LEFT JOIN room_type_amenities rta ON rta.room_type_id = rt.id
       LEFT JOIN amenities a ON a.id = rta.amenity_id
       WHERE rt.listing_id = ? ${activeClause}
       GROUP BY rt.id
       ORDER BY rt.price_per_night ASC, rt.id ASC`,
      [listingId]
    );

    return rooms.map((r) => ({
      ...r,
      price_per_night: Number(r.price_per_night),
      amenities: r.amenities_list ? r.amenities_list.split(";;") : [],
    }));
  } catch (err) {
    if (err.code === "ER_NO_SUCH_TABLE") {
      return [];
    }
    throw err;
  }
}

/**
 * Get single room by ID.
 */
async function getRoomById(roomId) {
  const [rows] = await pool.query(
    `SELECT rt.*, l.owner_id
     FROM room_types rt
     JOIN listings l ON l.listing_id = rt.listing_id
     WHERE rt.id = ?`,
    [roomId]
  );
  if (!rows.length) return null;
  return rows[0];
}

/**
 * Get maximum committed units in overlapping future bookings for a room type.
 */
async function getMaxCommittedUnits(roomTypeId) {
  const [rows] = await pool.query(
    `SELECT MAX(br.quantity) AS max_committed
     FROM booking_rooms br
     JOIN bookings b ON b.id = br.booking_id
     WHERE br.room_type_id = ?
       AND (b.status = 'confirmed' OR (b.status = 'pending_payment' AND (b.hold_expires_at IS NULL OR b.hold_expires_at > CURRENT_TIMESTAMP)))
       AND b.check_out >= CURRENT_DATE`,
    [roomTypeId]
  );
  return Number(rows[0]?.max_committed) || 0;
}

/**
 * Create a new room type.
 */
async function createRoomType(listingId, roomData) {
  const {
    name,
    description,
    category = "standard",
    bed_config,
    size_sqft,
    max_guests = 2,
    price_per_night,
    total_units = 1,
    amenities = [],
    imageUrl,
  } = roomData;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.query(
      `INSERT INTO room_types
        (listing_id, name, description, category, bed_config, size_sqft, max_guests, price_per_night, total_units, is_active, is_auto_generated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE)`,
      [
        listingId,
        name.trim(),
        description ? description.trim() : null,
        category,
        bed_config ? bed_config.trim() : null,
        size_sqft ? parseInt(size_sqft, 10) : null,
        Math.max(1, parseInt(max_guests, 10) || 1),
        Number(price_per_night),
        Math.max(1, parseInt(total_units, 10) || 1),
      ]
    );

    const roomTypeId = res.insertId;

    // Attach amenities
    if (Array.isArray(amenities) && amenities.length > 0) {
      for (const aName of amenities) {
        if (!aName.trim()) continue;
        const [aRows] = await conn.query("SELECT id FROM amenities WHERE name = ?", [aName.trim()]);
        let aid = aRows[0]?.id;
        if (!aid) {
          const [insA] = await conn.query("INSERT IGNORE INTO amenities (name) VALUES (?)", [aName.trim()]);
          aid = insA.insertId;
        }
        if (aid) {
          await conn.query("INSERT IGNORE INTO room_type_amenities (room_type_id, amenity_id) VALUES (?, ?)", [
            roomTypeId,
            aid,
          ]);
        }
      }
    }

    // Attach image
    if (imageUrl) {
      await conn.query(
        "INSERT INTO room_type_images (room_type_id, url, sort_order) VALUES (?, ?, 0)",
        [roomTypeId, imageUrl]
      );
    }

    await conn.commit();
    return roomTypeId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Update an existing room type with inventory reduction guard.
 */
async function updateRoomType(roomId, roomData) {
  const currentRoom = await getRoomById(roomId);
  if (!currentRoom) {
    throw new Error("Room type not found.");
  }

  const requestedUnits = parseInt(roomData.total_units, 10);
  if (requestedUnits !== undefined && !isNaN(requestedUnits)) {
    const committed = await getMaxCommittedUnits(roomId);
    if (requestedUnits < committed) {
      throw new Error(
        `Cannot reduce total units to ${requestedUnits}. There are upcoming bookings committed to ${committed} unit(s).`
      );
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE room_types
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           category = COALESCE(?, category),
           bed_config = COALESCE(?, bed_config),
           size_sqft = COALESCE(?, size_sqft),
           max_guests = COALESCE(?, max_guests),
           price_per_night = COALESCE(?, price_per_night),
           total_units = COALESCE(?, total_units),
           is_auto_generated = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        roomData.name ? roomData.name.trim() : null,
        roomData.description !== undefined ? roomData.description : null,
        roomData.category || null,
        roomData.bed_config !== undefined ? roomData.bed_config : null,
        roomData.size_sqft !== undefined ? roomData.size_sqft : null,
        roomData.max_guests ? parseInt(roomData.max_guests, 10) : null,
        roomData.price_per_night !== undefined ? Number(roomData.price_per_night) : null,
        requestedUnits || null,
        roomId,
      ]
    );

    // Update amenities if provided
    if (Array.isArray(roomData.amenities)) {
      await conn.query("DELETE FROM room_type_amenities WHERE room_type_id = ?", [roomId]);
      for (const aName of roomData.amenities) {
        if (!aName || !aName.trim()) continue;
        const [aRows] = await conn.query("SELECT id FROM amenities WHERE name = ?", [aName.trim()]);
        let aid = aRows[0]?.id;
        if (!aid) {
          const [insA] = await conn.query("INSERT IGNORE INTO amenities (name) VALUES (?)", [aName.trim()]);
          aid = insA.insertId;
        }
        if (aid) {
          await conn.query("INSERT IGNORE INTO room_type_amenities (room_type_id, amenity_id) VALUES (?, ?)", [
            roomId,
            aid,
          ]);
        }
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Soft delete room type (sets is_active = FALSE).
 */
async function softDeleteRoomType(roomId) {
  // Check if it's the last active room type of a listing with future bookings
  const room = await getRoomById(roomId);
  if (!room) throw new Error("Room not found.");

  const [activeRooms] = await pool.query(
    "SELECT id FROM room_types WHERE listing_id = ? AND is_active = TRUE",
    [room.listing_id]
  );

  if (activeRooms.length <= 1) {
    // Check if there are upcoming bookings
    const [futureBookings] = await pool.query(
      `SELECT id FROM bookings
       WHERE listing_id = ? AND check_out >= CURRENT_DATE
         AND status IN ('confirmed', 'pending_payment')`,
      [room.listing_id]
    );
    if (futureBookings.length > 0) {
      throw new Error(
        "Cannot deactivate the only active room type while this listing has upcoming bookings."
      );
    }
  }

  await pool.query("UPDATE room_types SET is_active = FALSE WHERE id = ?", [roomId]);
}

/**
 * Update listing payment policy.
 */
async function updatePaymentPolicy(listingId, policyData) {
  const allowAdvance = Boolean(policyData.allow_advance);
  const advanceType = policyData.advance_type === "fixed" ? "fixed" : "percent";
  const advanceValue = Math.max(0, Number(policyData.advance_value) || 0);

  await pool.query(
    `INSERT INTO listing_payment_policy (listing_id, allow_advance, advance_type, advance_value)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       allow_advance = VALUES(allow_advance),
       advance_type = VALUES(advance_type),
       advance_value = VALUES(advance_value),
       updated_at = CURRENT_TIMESTAMP`,
    [listingId, allowAdvance, advanceType, advanceValue]
  );
}

module.exports = {
  getRoomsByListing,
  getRoomById,
  getMaxCommittedUnits,
  createRoomType,
  updateRoomType,
  softDeleteRoomType,
  updatePaymentPolicy,
};
