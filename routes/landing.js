/**
 * routes/landing.js
 * Handles GET / – the public home page with working search & filters.
 * Logged-in visitors are redirected to /listings.
 */

"use strict";

const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const Wishlist = require("../models/wishlist");
const wrapAsync = require("../utils/wrapAsync");

router.get(
  "/",
  wrapAsync(async (req, res) => {
    if (req.isAuthenticated()) {
      return res.redirect("/listings");
    }

    const { search, category, minPrice, maxPrice, sort } = req.query;
    let listings = [];
    try {
      listings = await Listing.findAll({ search, category, minPrice, maxPrice, sort });
    } catch (err) {
      console.error("Error fetching listings for landing:", err);
      listings = [];
    }

    let wishlistListingIds = new Set();
    if (req.user) {
      try {
        wishlistListingIds = await Wishlist.getUserWishlistListingIds(req.user.id);
      } catch (err) {
        wishlistListingIds = new Set();
      }
    }

    res.render("landing.ejs", {
      listings,
      alllistings: listings,
      wishlistListingIds,
      search: search || "",
      category: category || "all",
      sort: sort || "default",
      minPrice: minPrice || "",
      maxPrice: maxPrice || "",
    });
  })
);

module.exports = router;
