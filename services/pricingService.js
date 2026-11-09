/**
 * services/pricingService.js
 * Calculates stay duration, room line-items, total amounts,
 * advance payment obligations, and balance amounts based on listing policies.
 */

"use strict";

const pool = require("../db/pool");

/**
 * Calculate the number of nights/days between two dates.
 */
function calculateNights(checkIn, checkOut) {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  const diffTime = d2.getTime() - d1.getTime();
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, nights);
}

/**
 * Fetch the payment policy for a listing, or fallback to default 25% percent advance.
 */
async function getListingPolicy(listingId, conn = pool) {
  const [rows] = await conn.query(
    "SELECT allow_advance, advance_type, advance_value FROM listing_payment_policy WHERE listing_id = ?",
    [listingId]
  );
  if (rows.length > 0) {
    return {
      allow_advance: Boolean(rows[0].allow_advance),
      advance_type: rows[0].advance_type,
      advance_value: Number(rows[0].advance_value),
    };
  }
  return {
    allow_advance: true,
    advance_type: "percent",
    advance_value: 25.0,
  };
}

/**
 * Compute the complete price quote for requested rooms and dates.
 *
 * @param {number} listingId
 * @param {string|Date} checkIn
 * @param {string|Date} checkOut
 * @param {Array<{roomTypeId: number, quantity: number, price_per_night?: number, name?: string}>} items
 * @param {Object} [options]
 * @returns {Promise<Object>}
 */
async function calculateQuote(listingId, checkIn, checkOut, items, options = {}) {
  const conn = options.connection || pool;
  const nights = calculateNights(checkIn, checkOut);
  const policy = await getListingPolicy(listingId, conn);

  // Fetch verified room prices directly from DB to prevent client tampering
  const roomIds = items.map((i) => Number(i.roomTypeId)).filter(Boolean);
  if (roomIds.length === 0) {
    throw new Error("No rooms selected.");
  }

  const [dbRooms] = await conn.query(
    `SELECT id, name, category, price_per_night, max_guests FROM room_types WHERE id IN (?) AND listing_id = ?`,
    [roomIds, listingId]
  );
  const dbRoomMap = new Map(dbRooms.map((r) => [r.id, r]));

  let totalAmount = 0;
  let totalCapacity = 0;
  const lineItems = [];

  for (const item of items) {
    const qty = parseInt(item.quantity, 10) || 0;
    if (qty <= 0) continue;

    const r = dbRoomMap.get(Number(item.roomTypeId));
    if (!r) {
      throw new Error(`Room type #${item.roomTypeId} is invalid for listing #${listingId}.`);
    }

    const unitPrice = Number(r.price_per_night);
    const lineTotal = unitPrice * qty * nights;
    totalAmount += lineTotal;
    totalCapacity += Number(r.max_guests) * qty;

    lineItems.push({
      roomTypeId: r.id,
      name: r.name,
      category: r.category,
      unitPrice,
      quantity: qty,
      nights,
      lineTotal,
    });
  }

  totalAmount = Math.round(totalAmount * 100) / 100;

  // Calculate advance amount
  let advanceRequired = totalAmount;
  if (policy.allow_advance && totalAmount > 0) {
    if (policy.advance_type === "percent") {
      const calcAdv = (totalAmount * policy.advance_value) / 100;
      advanceRequired = Math.min(totalAmount, Math.round(calcAdv * 100) / 100);
    } else {
      // Fixed advance
      advanceRequired = Math.min(totalAmount, policy.advance_value);
    }
  }

  const balanceDue = Math.max(0, Math.round((totalAmount - advanceRequired) * 100) / 100);

  return {
    listingId,
    checkIn: new Date(checkIn).toISOString().split("T")[0],
    checkOut: new Date(checkOut).toISOString().split("T")[0],
    nights,
    policy,
    lineItems,
    totalCapacity,
    totalAmount,
    advanceRequired,
    balanceDue,
    currency: "INR",
  };
}

module.exports = {
  calculateNights,
  getListingPolicy,
  calculateQuote,
};

