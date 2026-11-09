/**
 * routes/mockGateway.js
 * Hosted dummy checkout UI and callback processing.
 */

"use strict";

const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const mockGateway = require("../services/mockGateway");
const paymentService = require("../services/paymentService");
const bookingService = require("../services/bookingService");

// 1. Render Hosted Mock Gateway Checkout Page
router.get(
  "/mock-gateway/checkout/:orderId",
  wrapAsync(async (req, res) => {
    const { orderId } = req.params;
    const order = mockGateway.getOrder(orderId);

    if (!order) {
      req.flash("error", "Checkout session not found or expired.");
      return res.redirect("/dashboard/bookings");
    }

    const booking = await bookingService.getBookingById(order.bookingId);
    if (!booking) {
      req.flash("error", "Associated booking not found.");
      return res.redirect("/dashboard/bookings");
    }

    res.render("mockGateway/checkout.ejs", {
      order,
      booking,
    });
  })
);

// 2. Process Dummy Payment (Simulates gateway processing & redirect)
router.post(
  "/mock-gateway/checkout/:orderId",
  wrapAsync(async (req, res) => {
    const { orderId } = req.params;
    const paymentPayload = req.body;

    const result = await mockGateway.processPayment(orderId, paymentPayload);

    // Redirect to app callback with signed parameters
    const params = new URLSearchParams({
      orderId: result.orderId || orderId,
      paymentId: result.paymentId || "",
      bookingId: result.bookingId ? String(result.bookingId) : "",
      amount: result.amount ? String(result.amount) : "",
      purpose: result.purpose || "full",
      success: result.success ? "true" : "false",
      method: result.method || "card",
      cardNetwork: result.cardNetwork || "",
      cardLast4: result.cardLast4 || "",
      failureReason: result.failureReason || "",
      signature: result.signature || "",
    });

    res.redirect(`/payments/callback?${params.toString()}`);
  })
);

// 3. App Payment Callback (Webhook/redirect target)
router.get(
  "/payments/callback",
  wrapAsync(async (req, res) => {
    const {
      orderId,
      paymentId,
      bookingId,
      amount,
      purpose,
      success,
      method,
      cardNetwork,
      cardLast4,
      failureReason,
      signature,
    } = req.query;

    if (!orderId || !signature) {
      req.flash("error", "Invalid or missing payment callback parameters.");
      return res.redirect("/dashboard/bookings");
    }

    try {
      const updatedBooking = await paymentService.recordPaymentResult({
        orderId,
        paymentId: paymentId || null,
        bookingId: parseInt(bookingId, 10),
        success: success === "true",
        amount: Number(amount),
        purpose,
        method,
        cardNetwork,
        cardLast4,
        failureReason,
        signature,
      });

      if (success === "true") {
        req.flash("success", "Payment successful! Your reservation is confirmed.");
        return res.redirect(`/bookings/${updatedBooking.booking_id}/confirmation?status=success`);
      } else {
        req.flash("error", `Payment failed: ${failureReason || "Transaction declined."}`);
        return res.redirect(
          `/bookings/${updatedBooking.booking_id}/confirmation?status=failed&failureReason=${encodeURIComponent(
            failureReason || "Transaction declined"
          )}`
        );
      }
    } catch (err) {
      req.flash("error", `Payment processing error: ${err.message}`);
      return res.redirect(`/bookings/${bookingId || ""}`);
    }
  })
);

module.exports = router;

