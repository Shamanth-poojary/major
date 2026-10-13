/**
 * routes/landing.js
 * Handles GET / – the public landing page.
 * Logged-in visitors are redirected to /listings.
 */

"use strict";

const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");

router.get(
  "/",
  wrapAsync(async (req, res) => {
    if (req.isAuthenticated()) {
      return res.redirect("/listings");
    }
    let listings = [];
    try {
      listings = await Listing.findAll();
    } catch (err) {
      console.error("Error fetching listings for landing carousel:", err);
      listings = [];
    }
    res.render("landing.ejs", { listings });
  })
);

module.exports = router;
