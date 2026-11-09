/**
 * services/bookingService.js
 * Handles transactional reservation creation, slot holds,
 * concurrency-safe availability validation, and dashboard queries.
 */

"use strict";

const crypto = require("crypto");
const pool = require("../db/pool");
const availabilityService = require("./availabilityService");
const pricingService = require("./pricingService");

/**
 * Generate a friendly unique booking reference, e.g. WL-2026-A4B7C9
 */
function generateBookingRef() {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `WL-${year}-${rand}`;
}

/**
 * Create a new reservation with a 10-minute hold within a database transaction.
 *
 * @param {Object} data
 * @param {number} data.customerId
 * @param {number} data.listingId
 * @param {string} data.checkIn - 'YYYY-MM-DD'
 * @param {string} data.checkOut - 'YYYY-MM-DD'
 * @param {number} data.adults
 * @param {number} [data.children]
 * @param {string} data.contactPhone
 * @param {string} [data.specialRequests]
 * @param {Array<{roomTypeId: number, quantity: number}>} data.rooms
 * @returns {Promise<Object>} Created booking record
 */
async function createBooking(data) {
  const {
    customerId,
    listingId,
    checkIn,
    checkOut,
    adults = 1,
    children = 0,
    contactPhone,
    specialRequests = "",
    rooms = [],
  } = data;

  // 1. Basic validation with specific messages
  if (!customerId) {
    throw new Error("You must be logged in to make a reservation.");
  }
  if (!listingId) {
    throw new Error("Listing identifier is required.");
  }
  if (!checkIn || !checkOut) {
    throw new Error("Please select valid check-in and check-out dates.");
  }

  const cleanPhone = (contactPhone || "").trim() || "+91 98765 43210";

  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (dIn < now) {
    throw new Error("Check-in date cannot be in the past.");
  }
  if (dOut <= dIn) {
    throw new Error("Check-out date must be strictly after check-in date.");
  }
  if (!rooms.length || rooms.every((r) => !parseInt(r.quantity, 10))) {
    throw new Error("Please select at least one room to book.");
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 2. Prevent owner from booking their own listing
    const [listingRows] = await conn.query(
      "SELECT owner_id, title FROM listings WHERE listing_id = ?",
      [listingId]
    );
    if (!listingRows.length) {
      throw new Error("Listing not found.");
    }
    if (Number(listingRows[0].owner_id) === Number(customerId)) {
      throw new Error("You cannot book your own property.");
    }

    // 3. Concurrency lock on room_types rows for this listing
    const roomIds = rooms.map((r) => Number(r.roomTypeId)).filter(Boolean);
    const [lockedRooms] = await conn.query(
      `SELECT id, name, price_per_night, total_units, max_guests
       FROM room_types
       WHERE id IN (?) AND listing_id = ? AND is_active = TRUE
       FOR UPDATE`,
      [roomIds, listingId]
    );

    if (lockedRooms.length !== roomIds.length) {
      throw new Error("One or more selected room types are unavailable or inactive.");
    }

    // 4. Validate availability inside transaction
    const availCheck = await availabilityService.validateRequestedAvailability(
      listingId,
      checkIn,
      checkOut,
      rooms,
      { connection: conn }
    );

    if (!availCheck.isAvailable) {
      const msg = availCheck.conflicts.map((c) => c.reason).join(" ");
      throw new Error(msg || "The selected rooms are no longer available for these dates.");
    }

    // 5. Calculate verified pricing
    const quote = await pricingService.calculateQuote(
      listingId,
      checkIn,
      checkOut,
      rooms,
      { connection: conn }
    );

    // Verify guest capacity
    const totalGuests = (parseInt(adults, 10) || 1) + (parseInt(children, 10) || 0);
    if (totalGuests > quote.totalCapacity) {
      throw new Error(
        `Selected rooms accommodate up to ${quote.totalCapacity} guests, but ${totalGuests} guests were specified.`
      );
    }

    // 6. Generate booking reference & 10-minute hold
    let bookingRef = generateBookingRef();
    const holdMinutes = 10;
    const holdExpiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

    const [insertResult] = await conn.query(
      `INSERT INTO bookings
        (booking_ref, customer_id, listing_id, check_in, check_out,
         adults, children, contact_phone, special_requests,
         total_amount, advance_required, status, hold_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?)`,
      [
        bookingRef,
        customerId,
        listingId,
        quote.checkIn,
        quote.checkOut,
        parseInt(adults, 10) || 1,
        parseInt(children, 10) || 0,
        cleanPhone,
        specialRequests ? specialRequests.trim() : null,
        quote.totalAmount,
        quote.advanceRequired,
        holdExpiresAt,
      ]
    );

    const bookingId = insertResult.insertId;

    // 7. Insert booking_rooms snapshots
    for (const item of quote.lineItems) {
      await conn.query(
        `INSERT INTO booking_rooms (booking_id, room_type_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [bookingId, item.roomTypeId, item.quantity, item.unitPrice]
      );
    }

    await conn.commit();

    return {
      id: bookingId,
      bookingRef,
      customerId,
      listingId,
      listingTitle: listingRows[0].title,
      checkIn: quote.checkIn,
      checkOut: quote.checkOut,
      nights: quote.nights,
      totalAmount: quote.totalAmount,
      advanceRequired: quote.advanceRequired,
      balanceDue: quote.balanceDue,
      holdExpiresAt,
      lineItems: quote.lineItems,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Fetch booking details with security checks based on user role.
 */
async function getBookingById(bookingId, currentUser) {
  // Expire stale holds lazily
  await availabilityService.expireStaleHolds(pool);

  const [summaryRows] = await pool.query(
    `SELECT bs.*, l.title AS listing_title, l.location AS listing_location, l.country AS listing_country,
            l.image_url AS listing_image_url, l.owner_id,
            u.username AS customer_username, u.email AS customer_email,
            owner_u.username AS owner_username, owner_u.email AS owner_email
     FROM booking_summary bs
     JOIN listings l ON l.listing_id = bs.listing_id
     JOIN users u ON u.user_id = bs.customer_id
     JOIN users owner_u ON owner_u.user_id = l.owner_id
     WHERE bs.booking_id = ?`,
    [bookingId]
  );

  if (!summaryRows.length) {
    return null;
  }

  const booking = summaryRows[0];

  // Authorization check
  if (currentUser) {
    const currentUserId = Number(currentUser.id || currentUser.user_id);
    const isCustomer = Number(booking.customer_id) === currentUserId;
    const isOwner = Number(booking.owner_id) === currentUserId;
    const isAdmin = currentUser.role === "admin";

    if (!isCustomer && !isOwner && !isAdmin) {
      const err = new Error("You are not authorized to view this booking.");
      err.status = 403;
      err.statusCode = 403;
      throw err;
    }
  }

  // Fetch booked rooms
  const [rooms] = await pool.query(
    `SELECT br.quantity, br.unit_price, rt.id AS room_type_id, rt.name, rt.category, rt.bed_config
     FROM booking_rooms br
     JOIN room_types rt ON rt.id = br.room_type_id
     WHERE br.booking_id = ?`,
    [bookingId]
  );

  // Fetch payment history
  const [payments] = await pool.query(
    `SELECT id, gateway_order_id, gateway_payment_id, purpose, amount, method,
            card_network, card_last4, status, failure_reason, created_at, paid_at
     FROM payments
     WHERE booking_id = ?
     ORDER BY created_at DESC`,
    [bookingId]
  );

  return {
    ...booking,
    rooms,
    payments,
  };
}

/**
 * Get customer bookings for /dashboard/bookings
 */
async function getCustomerBookings(customerId) {
  await availabilityService.expireStaleHolds(pool);

  const [rows] = await pool.query(
    `SELECT bs.*, l.title AS listing_title, l.location AS listing_location, l.country AS listing_country,
            l.image_url AS listing_image_url
     FROM booking_summary bs
     JOIN listings l ON l.listing_id = bs.listing_id
     WHERE bs.customer_id = ?
     ORDER BY bs.created_at DESC`,
    [customerId]
  );
  return rows;
}

/**
 * Get owner bookings for /owner/bookings
 */
async function getOwnerBookings(ownerId) {
  await availabilityService.expireStaleHolds(pool);

  const [rows] = await pool.query(
    `SELECT bs.*, l.title AS listing_title, l.location AS listing_location,
            u.username AS customer_name, u.email AS customer_email
     FROM booking_summary bs
     JOIN listings l ON l.listing_id = bs.listing_id
     JOIN users u ON u.user_id = bs.customer_id
     WHERE l.owner_id = ?
     ORDER BY bs.created_at DESC`,
    [ownerId]
  );
  return rows;
}

/**
 * Get all bookings for /admin/bookings
 */
async function getAllBookingsAdmin() {
  await availabilityService.expireStaleHolds(pool);

  const [rows] = await pool.query(
    `SELECT bs.*, l.title AS listing_title, l.location AS listing_location,
            u.username AS customer_name, u.email AS customer_email,
            o.username AS owner_name
     FROM booking_summary bs
     JOIN listings l ON l.listing_id = bs.listing_id
     JOIN users u ON u.user_id = bs.customer_id
     JOIN users o ON o.user_id = l.owner_id
     ORDER BY bs.created_at DESC`
  );
  return rows;
}

module.exports = {
  generateBookingRef,
  createBooking,
  getBookingById,
  getCustomerBookings,
  getOwnerBookings,
  getAllBookingsAdmin,
};

