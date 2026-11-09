/**
 * services/availabilityService.js
 * Calculates real-time room availability for date ranges, accounting for
 * confirmed bookings and active (unexpired) reservation holds.
 */

"use strict";

const pool = require("../db/pool");

/**
 * Lazily expire stale pending_payment bookings whose hold_expires_at has passed.
 */
async function expireStaleHolds(conn = pool) {
  try {
    await conn.query(`
      UPDATE bookings
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending_payment'
        AND hold_expires_at IS NOT NULL
        AND hold_expires_at < CURRENT_TIMESTAMP
    `);
  } catch (err) {
    console.error("Error expiring stale holds:", err.message);
  }
}

/**
 * Get availability for all active room types of a listing across a date range.
 *
 * @param {number} listingId
 * @param {string|Date} checkIn - 'YYYY-MM-DD'
 * @param {string|Date} checkOut - 'YYYY-MM-DD'
 * @param {Object} [options]
 * @param {number} [options.excludeBookingId] - To exclude current booking when modifying
 * @param {Object} [options.connection] - MySQL transaction connection
 * @returns {Promise<Array<Object>>}
 */
async function getListingAvailability(listingId, checkIn, checkOut, options = {}) {
  const conn = options.connection || pool;

  // 1. Expire stale holds lazily
  await expireStaleHolds(conn);

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
    throw new Error("Invalid check-in or check-out date range.");
  }

  const checkInStr = checkInDate.toISOString().split("T")[0];
  const checkOutStr = checkOutDate.toISOString().split("T")[0];

  // 2. Query all active room types for this listing
  const [rooms] = await conn.query(
    `SELECT rt.id, rt.listing_id, rt.name, rt.description, rt.category,
            rt.bed_config, rt.size_sqft, rt.max_guests, rt.price_per_night,
            rt.total_units, rt.is_active, rt.is_auto_generated,
            GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ';;') AS amenities_list,
            (SELECT url FROM room_type_images rti WHERE rti.room_type_id = rt.id ORDER BY rti.sort_order ASC, rti.id ASC LIMIT 1) AS image_url
     FROM room_types rt
     LEFT JOIN room_type_amenities rta ON rta.room_type_id = rt.id
     LEFT JOIN amenities a ON a.id = rta.amenity_id
     WHERE rt.listing_id = ? AND rt.is_active = TRUE
     GROUP BY rt.id
     ORDER BY rt.price_per_night ASC, rt.id ASC`,
    [listingId]
  );

  if (!rooms.length) {
    return [];
  }

  // 3. Query overlapping bookings for these room types
  // Overlap condition: b.check_in < checkOut AND b.check_out > checkIn
  const excludeSql = options.excludeBookingId ? "AND b.id != ?" : "";
  const queryParams = [listingId, checkOutStr, checkInStr];
  if (options.excludeBookingId) queryParams.push(options.excludeBookingId);

  const [bookedRows] = await conn.query(
    `SELECT br.room_type_id, SUM(br.quantity) AS booked_units
     FROM booking_rooms br
     JOIN bookings b ON b.id = br.booking_id
     WHERE b.listing_id = ?
       AND (b.status = 'confirmed' OR (b.status = 'pending_payment' AND (b.hold_expires_at IS NULL OR b.hold_expires_at > CURRENT_TIMESTAMP)))
       AND b.check_in < ?
       AND b.check_out > ?
       ${excludeSql}
     GROUP BY br.room_type_id`,
    queryParams
  );

  const bookedMap = new Map();
  for (const row of bookedRows) {
    bookedMap.set(row.room_type_id, Number(row.booked_units) || 0);
  }

  return rooms.map((room) => {
    const booked = bookedMap.get(room.id) || 0;
    const availableUnits = Math.max(0, room.total_units - booked);
    return {
      id: room.id,
      listing_id: room.listing_id,
      name: room.name,
      description: room.description,
      category: room.category,
      bed_config: room.bed_config,
      size_sqft: room.size_sqft,
      max_guests: room.max_guests,
      price_per_night: Number(room.price_per_night),
      total_units: room.total_units,
      booked_units: booked,
      available_units: availableUnits,
      is_sold_out: availableUnits === 0,
      amenities: room.amenities_list ? room.amenities_list.split(";;") : [],
      image_url: room.image_url || null,
    };
  });
}

/**
 * Validate requested room selections against available units.
 *
 * @param {number} listingId
 * @param {string} checkIn
 * @param {string} checkOut
 * @param {Array<{roomTypeId: number, quantity: number}>} requestedRooms
 * @param {Object} [options]
 * @returns {Promise<{isAvailable: boolean, conflicts: Array<Object>, rooms: Array<Object>}>}
 */
async function validateRequestedAvailability(listingId, checkIn, checkOut, requestedRooms, options = {}) {
  const availableRooms = await getListingAvailability(listingId, checkIn, checkOut, options);
  const roomMap = new Map(availableRooms.map((r) => [r.id, r]));

  const conflicts = [];
  const validRooms = [];

  for (const item of requestedRooms) {
    const room = roomMap.get(Number(item.roomTypeId));
    const qty = parseInt(item.quantity, 10) || 0;

    if (!room) {
      conflicts.push({ roomTypeId: item.roomTypeId, reason: "Room type not found or inactive." });
      continue;
    }

    if (qty <= 0) continue;

    if (qty > room.available_units) {
      conflicts.push({
        roomTypeId: room.id,
        name: room.name,
        requested: qty,
        available: room.available_units,
        reason: `Only ${room.available_units} unit(s) of "${room.name}" available for the selected dates.`,
      });
    } else {
      validRooms.push({ ...room, selected_quantity: qty });
    }
  }

  return {
    isAvailable: conflicts.length === 0 && validRooms.length > 0,
    conflicts,
    rooms: validRooms,
  };
}

module.exports = {
  expireStaleHolds,
  getListingAvailability,
  validateRequestedAvailability,
};

