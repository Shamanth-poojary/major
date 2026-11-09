/**
 * services/paymentService.js
 * Orchestrates payment creation, idempotency, gateway order dispatch,
 * and database status transitions for bookings and payments.
 */

"use strict";

const crypto = require("crypto");
const pool = require("../db/pool");
const mockGateway = require("./mockGateway");
const bookingService = require("./bookingService");

/**
 * Generate a deterministic idempotency key for an order attempt.
 */
function generateIdempotencyKey(bookingId, purpose, amount) {
  return crypto
    .createHash("sha256")
    .update(`${bookingId}-${purpose}-${amount}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`)
    .digest("hex");
}

/**
 * Initiate a payment attempt for a reservation.
 *
 * @param {Object} params
 * @param {number} params.bookingId
 * @param {'advance'|'balance'|'full'} params.purpose
 * @param {Object} params.currentUser
 * @returns {Promise<{checkoutUrl: string, orderId: string, amount: number, purpose: string}>}
 */
async function initiatePayment({ bookingId, purpose = "full", currentUser }) {
  const booking = await bookingService.getBookingById(bookingId, currentUser);
  if (!booking) {
    throw new Error("Booking not found.");
  }

  // Check booking state
  if (booking.booking_status === "cancelled") {
    throw new Error("Cannot pay for a cancelled booking.");
  }
  if (booking.booking_status === "expired") {
    throw new Error("This booking reservation hold has expired. Please make a new reservation.");
  }

  // Determine amount based on purpose
  let payableAmount = 0;
  if (purpose === "advance") {
    if (booking.payment_status === "paid" || booking.payment_status === "partially_paid") {
      throw new Error("Advance payment has already been made for this booking.");
    }
    payableAmount = Number(booking.advance_required);
  } else if (purpose === "balance") {
    payableAmount = Number(booking.balance_due);
    if (payableAmount <= 0) {
      throw new Error("This booking has no remaining balance due.");
    }
  } else {
    // Full payment
    if (booking.payment_status === "paid") {
      throw new Error("This booking is already fully paid.");
    }
    payableAmount = Number(booking.total_amount);
  }

  payableAmount = Math.round(payableAmount * 100) / 100;
  if (payableAmount <= 0) {
    throw new Error("Payable amount must be greater than zero.");
  }

  // Create gateway order
  const gatewayOrder = mockGateway.createOrder({
    bookingId: booking.booking_id,
    amount: payableAmount,
    purpose,
    customerEmail: booking.customer_email,
  });

  const idempotencyKey = generateIdempotencyKey(booking.booking_id, purpose, payableAmount);

  // Record initial payment intent in DB
  await pool.query(
    `INSERT INTO payments
      (booking_id, gateway_order_id, purpose, amount, method, status, idempotency_key)
     VALUES (?, ?, ?, ?, 'card', 'created', ?)`,
    [booking.booking_id, gatewayOrder.orderId, purpose, payableAmount, idempotencyKey]
  );

  return {
    checkoutUrl: gatewayOrder.checkoutUrl,
    orderId: gatewayOrder.orderId,
    amount: payableAmount,
    purpose,
    bookingRef: booking.booking_ref,
  };
}

/**
 * Handle gateway outcome callback, verify signature, and update database.
 *
 * @param {Object} outcomePayload
 * @returns {Promise<Object>}
 */
async function recordPaymentResult(outcomePayload) {
  const {
    orderId,
    paymentId,
    bookingId,
    success,
    amount,
    purpose,
    method = "card",
    cardNetwork = null,
    cardLast4 = null,
    failureReason = null,
    signature,
  } = outcomePayload;

  // 1. Verify cryptographic signature from gateway
  const isValid = mockGateway.verifyCallbackSignature({
    orderId,
    paymentId,
    status: success ? "success" : "failed",
    amount,
    signature,
  });

  if (!isValid) {
    throw new Error("Invalid payment callback signature.");
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 2. Lock payment row to guarantee idempotency
    const [existingPayments] = await conn.query(
      `SELECT id, booking_id, status FROM payments WHERE gateway_order_id = ? FOR UPDATE`,
      [orderId]
    );

    if (!existingPayments.length) {
      throw new Error(`Payment intent for order ${orderId} not found.`);
    }

    const currentPayment = existingPayments[0];

    // If already marked success, idempotently return without changes
    if (currentPayment.status === "success") {
      await conn.commit();
      return await bookingService.getBookingById(bookingId);
    }

    // 3. Update payment row
    const newStatus = success ? "success" : "failed";
    await conn.query(
      `UPDATE payments
       SET status = ?,
           gateway_payment_id = ?,
           method = ?,
           card_network = ?,
           card_last4 = ?,
           failure_reason = ?,
           paid_at = ${success ? "CURRENT_TIMESTAMP" : "NULL"}
       WHERE id = ?`,
      [newStatus, paymentId || null, method, cardNetwork, cardLast4, failureReason || null, currentPayment.id]
    );

    // 4. If payment succeeded, transition booking to 'confirmed' and release hold
    if (success) {
      await conn.query(
        `UPDATE bookings
         SET status = 'confirmed',
             hold_expires_at = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [bookingId]
      );
    }

    await conn.commit();

    return await bookingService.getBookingById(bookingId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  generateIdempotencyKey,
  initiatePayment,
  recordPaymentResult,
};

