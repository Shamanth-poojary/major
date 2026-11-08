/**
 * routes/booking.js
 * Mounts routes for availability, quoting, reservation checkout,
 * and booking management.
 */

"use strict";

const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, requireRole } = require("../middleware");
const bookingController = require("../controller/bookings");

// Customer booking flows
router.get("/:id/payment", isLoggedIn, requireRole("customer"), wrapAsync(bookingController.renderPaymentOptions));
router.post("/:id/pay", isLoggedIn, requireRole("customer"), wrapAsync(bookingController.initiateOrder));
router.post("/:id/pay-balance", isLoggedIn, requireRole("customer"), wrapAsync(bookingController.payBalance));
router.get("/:id/confirmation", isLoggedIn, wrapAsync(bookingController.renderConfirmation));
router.get("/:id/receipt", isLoggedIn, wrapAsync(bookingController.renderReceipt));
router.get("/:id", isLoggedIn, wrapAsync(bookingController.showBooking));
router.post("/", isLoggedIn, requireRole("customer"), wrapAsync(bookingController.postBooking));

module.exports = router;
