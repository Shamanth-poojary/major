/**
 * controller/bookings.js
 * Controller handling availability endpoints, quoting, checkout flow,
 * booking creation, and booking detail retrieval.
 */

"use strict";

const availabilityService = require("../services/availabilityService");
const pricingService = require("../services/pricingService");
const bookingService = require("../services/bookingService");
const paymentService = require("../services/paymentService");
const listingModel = require("../models/listing");
const pool = require("../db/pool");

/**
 * GET /listings/:id/availability?checkIn=...&checkOut=...
 * Live JSON endpoint for date-based room availability
 */
async function getAvailability(req, res) {
  const listingId = parseInt(req.params.id, 10);
  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return res.status(400).json({ error: "Both checkIn and checkOut dates are required." });
  }

  try {
    const rooms = await availabilityService.getListingAvailability(listingId, checkIn, checkOut);
    return res.json({ listingId, checkIn, checkOut, rooms });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * POST /listings/:id/quote
 * Live price and advance breakdown JSON endpoint
 */
async function getQuote(req, res) {
  const listingId = parseInt(req.params.id, 10);
  const { checkIn, checkOut, rooms } = req.body;

  if (!checkIn || !checkOut || !Array.isArray(rooms)) {
    return res.status(400).json({ error: "checkIn, checkOut, and rooms array are required." });
  }

  try {
    const quote = await pricingService.calculateQuote(listingId, checkIn, checkOut, rooms);
    return res.json(quote);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /listings/:id/book
 * Multi-step booking page
 */
async function renderBookingPage(req, res) {
  const listingId = parseInt(req.params.id, 10);
  const listing = await listingModel.findById(listingId);

  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  // Prevent owner from booking own listing
  if (req.user && req.user.user_id === listing.owner.id) {
    req.flash("error", "You cannot book your own property.");
    return res.redirect(`/listings/${listingId}`);
  }

  const { checkIn, checkOut, adults = 1, children = 0 } = req.query;

  // Fetch all active room types for initial display
  const [roomRows] = await pool.query(
    `SELECT rt.*,
            GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ';;') AS amenities_list,
            (SELECT url FROM room_type_images rti WHERE rti.room_type_id = rt.id ORDER BY rti.sort_order ASC LIMIT 1) AS image_url
     FROM room_types rt
     LEFT JOIN room_type_amenities rta ON rta.room_type_id = rt.id
     LEFT JOIN amenities a ON a.id = rta.amenity_id
     WHERE rt.listing_id = ? AND rt.is_active = TRUE
     GROUP BY rt.id
     ORDER BY rt.price_per_night ASC`,
    [listingId]
  );

  const rooms = roomRows.map((r) => ({
    ...r,
    price_per_night: Number(r.price_per_night),
    amenities: r.amenities_list ? r.amenities_list.split(";;") : [],
  }));

  const policy = await pricingService.getListingPolicy(listingId);

  res.render("bookings/book.ejs", {
    listing,
    rooms,
    policy,
    prefill: {
      checkIn: checkIn || "",
      checkOut: checkOut || "",
      adults: parseInt(adults, 10) || 1,
      children: parseInt(children, 10) || 0,
      contactPhone: req.user?.phone || "",
    },
  });
}

/**
 * POST /bookings
 * Create reservation and redirect to payment choice
 */
async function postBooking(req, res) {
  const { listingId, checkIn, checkOut, adults, children, contactPhone, specialRequests, rooms } = req.body;

  if (!listingId) {
    req.flash("error", "Invalid listing selection.");
    return res.redirect("/listings");
  }

  if (!checkIn || !checkOut) {
    req.flash("error", "Please select valid check-in and check-out dates.");
    return res.redirect(`/listings/${listingId}/book`);
  }

  let parsedRooms = [];
  try {
    parsedRooms = typeof rooms === "string" ? JSON.parse(rooms) : rooms;
  } catch (e) {
    parsedRooms = [];
  }

  if (!Array.isArray(parsedRooms) || parsedRooms.length === 0 || parsedRooms.every((r) => !parseInt(r.quantity, 10))) {
    req.flash("error", "Please select at least one room to proceed.");
    return res.redirect(`/listings/${listingId}/book?checkIn=${encodeURIComponent(checkIn || "")}&checkOut=${encodeURIComponent(checkOut || "")}`);
  }

  const customerId = req.user.user_id || req.user.id;
  const finalPhone = (contactPhone || req.user?.phone || "").trim() || "+91 98765 43210";

  try {
    const booking = await bookingService.createBooking({
      customerId,
      listingId: parseInt(listingId, 10),
      checkIn,
      checkOut,
      adults: parseInt(adults, 10) || 1,
      children: parseInt(children, 10) || 0,
      contactPhone: finalPhone,
      specialRequests: specialRequests || "",
      rooms: parsedRooms,
    });

    req.flash("success", "Reservation slot reserved! Please select a payment option to confirm your booking.");
    res.redirect(`/bookings/${booking.id}/payment`);
  } catch (err) {
    req.flash("error", err.message || "Failed to create reservation.");
    res.redirect(`/listings/${listingId}/book?checkIn=${encodeURIComponent(checkIn || "")}&checkOut=${encodeURIComponent(checkOut || "")}`);
  }
}

/**
 * GET /bookings/:id/payment
 * Choose between Pay Advance vs Pay Full Amount
 */
async function renderPaymentOptions(req, res) {
  const bookingId = parseInt(req.params.id, 10);
  const booking = await bookingService.getBookingById(bookingId, req.user);

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/dashboard/bookings");
  }

  if (booking.booking_status === "confirmed" && booking.payment_status === "paid") {
    req.flash("info", "This booking is already fully paid.");
    return res.redirect(`/bookings/${bookingId}`);
  }

  if (booking.booking_status === "expired") {
    req.flash("error", "Your reservation hold has expired. Please select your dates and book again.");
    return res.redirect(`/listings/${booking.listing_id}`);
  }

  const policy = await pricingService.getListingPolicy(booking.listing_id);

  res.render("bookings/payment.ejs", {
    booking,
    policy,
  });
}

/**
 * POST /bookings/:id/pay
 * Initiate payment order and redirect to mock gateway checkout
 */
async function initiateOrder(req, res) {
  const bookingId = parseInt(req.params.id, 10);
  const { purpose = "full" } = req.body;

  try {
    const order = await paymentService.initiatePayment({
      bookingId,
      purpose,
      currentUser: req.user,
    });

    res.redirect(order.checkoutUrl);
  } catch (err) {
    req.flash("error", err.message || "Failed to initiate payment.");
    res.redirect(`/bookings/${bookingId}/payment`);
  }
}

/**
 * POST /bookings/:id/pay-balance
 * Customer paying remaining balance from dashboard
 */
async function payBalance(req, res) {
  const bookingId = parseInt(req.params.id, 10);
  try {
    const order = await paymentService.initiatePayment({
      bookingId,
      purpose: "balance",
      currentUser: req.user,
    });
    res.redirect(order.checkoutUrl);
  } catch (err) {
    req.flash("error", err.message || "Failed to initiate balance payment.");
    res.redirect(`/bookings/${bookingId}`);
  }
}

/**
 * GET /bookings/:id
 * Booking details page
 */
async function showBooking(req, res) {
  const bookingId = parseInt(req.params.id, 10);
  const booking = await bookingService.getBookingById(bookingId, req.user);

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/dashboard/bookings");
  }

  res.render("bookings/show.ejs", { booking });
}

/**
 * GET /bookings/:id/receipt
 * Clean printable receipt
 */
async function renderReceipt(req, res) {
  const bookingId = parseInt(req.params.id, 10);
  const booking = await bookingService.getBookingById(bookingId, req.user);

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/dashboard/bookings");
  }

  res.render("bookings/receipt.ejs", { booking });
}

/**
 * GET /bookings/:id/confirmation
 * Success or failure confirmation page
 */
async function renderConfirmation(req, res) {
  const bookingId = parseInt(req.params.id, 10);
  const booking = await bookingService.getBookingById(bookingId, req.user);

  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/dashboard/bookings");
  }

  const { status, failureReason } = req.query;

  res.render("bookings/confirmation.ejs", {
    booking,
    isSuccess: status === "success" || booking.booking_status === "confirmed",
    failureReason: failureReason || null,
  });
}

module.exports = {
  getAvailability,
  getQuote,
  renderBookingPage,
  postBooking,
  renderPaymentOptions,
  initiateOrder,
  payBalance,
  showBooking,
  renderReceipt,
  renderConfirmation,
};

