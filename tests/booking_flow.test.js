/**
 * tests/booking_flow.test.js
 * Integration test suite for booking reservations, availability checks,
 * concurrency-safe slot holds, advance/balance payments, and mock gateway outcomes.
 */

"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

const availabilityService = require("../services/availabilityService");
const pricingService = require("../services/pricingService");
const bookingService = require("../services/bookingService");
const paymentService = require("../services/paymentService");
const mockGateway = require("../services/mockGateway");
const pool = require("../db/pool");

describe("Booking and Mock Payment Gateway Integration Suite", { concurrency: 1 }, () => {
  let customerId, ownerId, listingId, roomTypeId;

  before(async () => {
    // 1. Create test users (customer & owner)
    const [cUser] = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ('test_cust_101', 'cust101@test.com', 'hash123', 'customer')
       ON DUPLICATE KEY UPDATE user_id=LAST_INSERT_ID(user_id)`
    );
    customerId = cUser.insertId;

    const [oUser] = await pool.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ('test_owner_101', 'owner101@test.com', 'hash123', 'owner')
       ON DUPLICATE KEY UPDATE user_id=LAST_INSERT_ID(user_id)`
    );
    ownerId = oUser.insertId;

    // 2. Create test listing
    const [lRes] = await pool.query(
      `INSERT INTO listings (owner_id, title, description, price, location, country, image_url)
       VALUES (?, 'Test Paradise Resort', 'Beautiful test property', 5000.00, 'Goa', 'India', 'https://example.com/test.jpg')`,
      [ownerId]
    );
    listingId = lRes.insertId;

    // 3. Create test room type with 2 units available
    const [rRes] = await pool.query(
      `INSERT INTO room_types (listing_id, name, category, price_per_night, total_units, max_guests, is_active)
       VALUES (?, 'Deluxe Ocean Room', 'deluxe', 5000.00, 2, 2, TRUE)`,
      [listingId]
    );
    roomTypeId = rRes.insertId;

    // 4. Create default 25% advance payment policy
    await pool.query(
      `INSERT INTO listing_payment_policy (listing_id, allow_advance, advance_type, advance_value)
       VALUES (?, TRUE, 'percent', 25.00)
       ON DUPLICATE KEY UPDATE allow_advance=TRUE, advance_type='percent', advance_value=25.00`,
      [listingId]
    );
  });

  after(async () => {
    // Cleanup test data (delete child payments first due to ON DELETE RESTRICT)
    if (customerId || ownerId) {
      await pool.query(
        `DELETE p FROM payments p 
         JOIN bookings b ON b.id = p.booking_id 
         WHERE b.customer_id IN (?, ?) OR b.listing_id = ?`,
        [customerId, ownerId, listingId]
      );
      await pool.query("DELETE FROM bookings WHERE customer_id IN (?, ?) OR listing_id = ?", [
        customerId,
        ownerId,
        listingId,
      ]);
      await pool.query("DELETE FROM listings WHERE listing_id = ?", [listingId]);
      await pool.query("DELETE FROM users WHERE user_id IN (?, ?)", [customerId, ownerId]);
    }
    await pool.end();
  });

  it("1. Availability check returns 2 units available initially", async () => {
    const checkIn = "2027-01-10";
    const checkOut = "2027-01-12";
    const rooms = await availabilityService.getListingAvailability(listingId, checkIn, checkOut);

    assert.equal(rooms.length, 1);
    assert.equal(rooms[0].id, roomTypeId);
    assert.equal(rooms[0].available_units, 2);
    assert.equal(rooms[0].is_sold_out, false);
  });

  it("2. Pricing service correctly computes 2 nights, total, and 25% advance", async () => {
    const checkIn = "2027-01-10";
    const checkOut = "2027-01-12"; // 2 nights
    const quote = await pricingService.calculateQuote(listingId, checkIn, checkOut, [
      { roomTypeId, quantity: 1 },
    ]);

    assert.equal(quote.nights, 2);
    assert.equal(quote.totalAmount, 10000.0); // 5000 * 1 room * 2 nights
    assert.equal(quote.advanceRequired, 2500.0); // 25% of 10000
    assert.equal(quote.balanceDue, 7500.0);
  });

  it("3. Transactional booking creation succeeds and places a 10-minute slot hold", async () => {
    const checkIn = "2027-01-10";
    const checkOut = "2027-01-12";

    const booking = await bookingService.createBooking({
      customerId,
      listingId,
      checkIn,
      checkOut,
      adults: 2,
      contactPhone: "+91 99999 88888",
      rooms: [{ roomTypeId, quantity: 1 }],
    });

    assert.ok(booking.id);
    assert.match(booking.bookingRef, /^WL-\d{4}-[A-Z0-9]+$/);
    assert.equal(booking.totalAmount, 10000.0);
    assert.equal(booking.advanceRequired, 2500.0);

    // Verify slot hold reduced available units to 1
    const avail = await availabilityService.getListingAvailability(listingId, checkIn, checkOut);
    const room = avail.find((r) => r.id === roomTypeId);
    assert.equal(room.available_units, 1);

    // Verify authorization works with Passport user shape { id, role }
    const fetched = await bookingService.getBookingById(booking.id, { id: customerId, role: "customer" });
    assert.ok(fetched);
    assert.equal(fetched.booking_id, booking.id);

    // Unauthorized user fails with 403
    await assert.rejects(
      async () => {
        await bookingService.getBookingById(booking.id, { id: 999999, role: "customer" });
      },
      { message: /not authorized/ }
    );
  });

  it("4. Concurrency guard: booking more units than available throws availability error", async () => {
    const checkIn = "2027-01-10";
    const checkOut = "2027-01-12";

    await assert.rejects(
      async () => {
        await bookingService.createBooking({
          customerId,
          listingId,
          checkIn,
          checkOut,
          adults: 4,
          contactPhone: "+91 99999 88888",
          rooms: [{ roomTypeId, quantity: 2 }], // Only 1 left!
        });
      },
      {
        message: /Only 1 unit\(s\) of "Deluxe Ocean Room" available/,
      }
    );
  });

  it("5. Mock payment gateway card validation and OTP approval workflow", async () => {
    const checkIn = "2027-02-01";
    const checkOut = "2027-02-03";

    // Create fresh booking for payment test
    const booking = await bookingService.createBooking({
      customerId,
      listingId,
      checkIn,
      checkOut,
      adults: 2,
      contactPhone: "+91 99999 11111",
      rooms: [{ roomTypeId, quantity: 1 }],
    });

    // 5a. Initiate advance payment
    const paymentOrder = await paymentService.initiatePayment({
      bookingId: booking.id,
      purpose: "advance",
      currentUser: { user_id: customerId, role: "customer" },
    });

    assert.equal(paymentOrder.amount, 2500.0);
    assert.ok(paymentOrder.checkoutUrl.includes(paymentOrder.orderId));

    // 5b. Card declined test input
    const declineResult = await mockGateway.processPayment(paymentOrder.orderId, {
      method: "card",
      cardNumber: "4000 0000 0000 0002",
      cardExpiry: "12/28",
      cardCvv: "123",
      cardHolder: "Test Customer",
      otp: "123456",
    });
    assert.equal(declineResult.success, false);
    assert.equal(declineResult.failureReason, "Card declined by issuing bank.");

    // 5c. Wrong OTP test input
    const badOtpResult = await mockGateway.processPayment(paymentOrder.orderId, {
      method: "card",
      cardNumber: "4111 1111 1111 1111",
      cardExpiry: "12/28",
      cardCvv: "123",
      cardHolder: "Test Customer",
      otp: "999999",
    });
    assert.equal(badOtpResult.success, false);
    assert.match(badOtpResult.failureReason, /Incorrect or expired OTP/);

    // 5d. Correct card and OTP (123456)
    const successResult = await mockGateway.processPayment(paymentOrder.orderId, {
      method: "card",
      cardNumber: "4111 1111 1111 1111",
      cardExpiry: "12/28",
      cardCvv: "123",
      cardHolder: "Test Customer",
      otp: "123456",
    });
    assert.equal(successResult.success, true);
    assert.equal(successResult.cardLast4, "1111");
    assert.equal(successResult.cardNetwork, "Visa");

    // 5e. Process callback & update DB
    const updatedBooking = await paymentService.recordPaymentResult(successResult);
    assert.equal(updatedBooking.booking_status, "confirmed");
    assert.equal(updatedBooking.payment_status, "partially_paid");
    assert.equal(updatedBooking.amount_paid, 2500.0);
    assert.equal(updatedBooking.balance_due, 7500.0);
    assert.equal(updatedBooking.hold_expires_at, null); // Slot hold released to confirmed

    // 5f. Settle remaining balance
    const balanceOrder = await paymentService.initiatePayment({
      bookingId: booking.id,
      purpose: "balance",
      currentUser: { user_id: customerId, role: "customer" },
    });
    assert.equal(balanceOrder.amount, 7500.0);

    const balancePayResult = await mockGateway.processPayment(balanceOrder.orderId, {
      method: "upi",
      upiId: "success@mock",
    });
    assert.equal(balancePayResult.success, true);

    const finalBooking = await paymentService.recordPaymentResult(balancePayResult);
    assert.equal(finalBooking.booking_status, "confirmed");
    assert.equal(finalBooking.payment_status, "paid");
    assert.equal(finalBooking.balance_due, 0.0);
    assert.equal(finalBooking.amount_paid, 10000.0);
  });
});
