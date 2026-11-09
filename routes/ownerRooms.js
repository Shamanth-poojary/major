/**
 * routes/ownerRooms.js
 * Owner endpoints for room configuration, generation, inventory guards,
 * and listing payment policy management.
 */

"use strict";

const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, requireRole, isApprovedOwner } = require("../middleware");
const roomService = require("../services/roomService");
const roomGenerator = require("../services/roomGenerator");
const listingModel = require("../models/listing");
const pool = require("../db/pool");

// Middleware: verify current user owns the listing
async function verifyListingOwnership(req, res, next) {
  const listingId = parseInt(req.params.id || req.body.listingId, 10);
  if (!listingId) {
    req.flash("error", "Listing ID is required.");
    return res.redirect("/dashboard/listings");
  }

  const [rows] = await pool.query("SELECT owner_id, title FROM listings WHERE listing_id = ?", [
    listingId,
  ]);
  if (!rows.length) {
    req.flash("error", "Listing not found.");
    return res.redirect("/dashboard/listings");
  }

  if (rows[0].owner_id !== req.user.user_id && req.user.role !== "admin") {
    req.flash("error", "You do not have permission to manage rooms for this listing.");
    return res.redirect("/dashboard/listings");
  }

  req.currentListing = rows[0];
  next();
}

// 1. Manage Rooms Page
router.get(
  "/listings/:id/rooms",
  isLoggedIn,
  isApprovedOwner,
  verifyListingOwnership,
  wrapAsync(async (req, res) => {
    const listingId = parseInt(req.params.id, 10);
    const listing = await listingModel.findById(listingId);
    const rooms = await roomService.getRoomsByListing(listingId, true); // Include inactive

    const [policyRows] = await pool.query(
      "SELECT * FROM listing_payment_policy WHERE listing_id = ?",
      [listingId]
    );
    const policy = policyRows[0] || {
      allow_advance: 1,
      advance_type: "percent",
      advance_value: 25.0,
    };

    const [allAmenities] = await pool.query("SELECT name FROM amenities ORDER BY name ASC");

    res.render("owner/rooms.ejs", {
      listing,
      rooms,
      policy,
      availableAmenities: allAmenities.map((a) => a.name),
    });
  })
);

// 2. Create Room Type
router.post(
  "/listings/:id/rooms",
  isLoggedIn,
  isApprovedOwner,
  verifyListingOwnership,
  wrapAsync(async (req, res) => {
    const listingId = parseInt(req.params.id, 10);
    const {
      name,
      description,
      category,
      bed_config,
      size_sqft,
      max_guests,
      price_per_night,
      total_units,
      amenities,
    } = req.body;

    let parsedAmenities = [];
    if (amenities) {
      parsedAmenities = Array.isArray(amenities) ? amenities : [amenities];
    }

    try {
      await roomService.createRoomType(listingId, {
        name,
        description,
        category,
        bed_config,
        size_sqft,
        max_guests,
        price_per_night,
        total_units,
        amenities: parsedAmenities,
      });

      req.flash("success", `Room type "${name}" created successfully!`);
    } catch (err) {
      req.flash("error", err.message);
    }

    res.redirect(`/owner/listings/${listingId}/rooms`);
  })
);

// 3. Edit Room Type
router.post(
  "/rooms/:roomId",
  isLoggedIn,
  isApprovedOwner,
  wrapAsync(async (req, res) => {
    const roomId = parseInt(req.params.roomId, 10);
    const room = await roomService.getRoomById(roomId);

    if (!room || (room.owner_id !== req.user.user_id && req.user.role !== "admin")) {
      req.flash("error", "Room not found or unauthorized.");
      return res.redirect("/dashboard/listings");
    }

    const {
      name,
      description,
      category,
      bed_config,
      size_sqft,
      max_guests,
      price_per_night,
      total_units,
      amenities,
    } = req.body;

    let parsedAmenities = [];
    if (amenities) {
      parsedAmenities = Array.isArray(amenities) ? amenities : [amenities];
    }

    try {
      await roomService.updateRoomType(roomId, {
        name,
        description,
        category,
        bed_config,
        size_sqft,
        max_guests,
        price_per_night,
        total_units,
        amenities: parsedAmenities,
      });

      req.flash("success", `Room "${name}" updated successfully.`);
    } catch (err) {
      req.flash("error", err.message);
    }

    res.redirect(`/owner/listings/${room.listing_id}/rooms`);
  })
);

// 4. Soft Delete Room Type
router.post(
  "/rooms/:roomId/delete",
  isLoggedIn,
  isApprovedOwner,
  wrapAsync(async (req, res) => {
    const roomId = parseInt(req.params.roomId, 10);
    const room = await roomService.getRoomById(roomId);

    if (!room || (room.owner_id !== req.user.user_id && req.user.role !== "admin")) {
      req.flash("error", "Room not found or unauthorized.");
      return res.redirect("/dashboard/listings");
    }

    try {
      await roomService.softDeleteRoomType(roomId);
      req.flash("success", `Room "${room.name}" has been deactivated.`);
    } catch (err) {
      req.flash("error", err.message);
    }

    res.redirect(`/owner/listings/${room.listing_id}/rooms`);
  })
);

// 5. Generate Room Suggestions (JSON Preview)
router.post(
  "/listings/:id/rooms/generate",
  isLoggedIn,
  isApprovedOwner,
  verifyListingOwnership,
  wrapAsync(async (req, res) => {
    const listingId = parseInt(req.params.id, 10);
    const listing = await listingModel.findById(listingId);

    const suggestions = roomGenerator.generateRoomTypes({
      listing_id: listingId,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      business_type: req.currentListing.business_type || "",
    });

    res.json({ listingId, suggestions });
  })
);

// 6. Save Bulk Room Types
router.post(
  "/listings/:id/rooms/bulk",
  isLoggedIn,
  isApprovedOwner,
  verifyListingOwnership,
  wrapAsync(async (req, res) => {
    const listingId = parseInt(req.params.id, 10);
    const { rooms } = req.body;

    let roomList = [];
    try {
      roomList = typeof rooms === "string" ? JSON.parse(rooms) : rooms;
    } catch (e) {
      roomList = [];
    }

    if (!Array.isArray(roomList) || roomList.length === 0) {
      req.flash("error", "No rooms provided to save.");
      return res.redirect(`/owner/listings/${listingId}/rooms`);
    }

    for (const r of roomList) {
      await roomService.createRoomType(listingId, r);
    }

    req.flash("success", `Saved ${roomList.length} room types successfully!`);
    res.redirect(`/owner/listings/${listingId}/rooms`);
  })
);

// 7. Update Listing Payment Policy
router.post(
  "/listings/:id/payment-policy",
  isLoggedIn,
  isApprovedOwner,
  verifyListingOwnership,
  wrapAsync(async (req, res) => {
    const listingId = parseInt(req.params.id, 10);
    const { allow_advance, advance_type, advance_value } = req.body;

    await roomService.updatePaymentPolicy(listingId, {
      allow_advance: allow_advance === "on" || allow_advance === "1" || allow_advance === true,
      advance_type,
      advance_value,
    });

    req.flash("success", "Payment policy updated successfully.");
    res.redirect(`/owner/listings/${listingId}/rooms`);
  })
);

module.exports = router;

