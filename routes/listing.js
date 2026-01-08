const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const validateListing = require("../utils/validateListing");
const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
//index route
router.get("/", async (req, res) => {
  const alllistings = await Listing.find({});
  res.render("listings/index.ejs", { alllistings });
});
//new route
router.get("/new", (req, res) => {
  res.render("listings/new.ejs");
});

// show route
router.get(
  "/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id).populate("reviews");

    // if (!listing) {
    //   throw new ExpressError(404, "Listing not found");
    // }
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  })
);
//post route
router.post(
  "/",
  validateListing,
  wrapAsync(async (req, res) => {
    const newlisting = new Listing(req.body.listing);
    await newlisting.save();
    req.flash("success", "Successfully created a new listing!");
    res.redirect("/listings");
  })
);
//edit route
router.get(
  "/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
  })
);
//update route
router.put(
  "/:id",
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, {
      ...req.body.listing,
    });
    req.flash("success", "listing edited successfully!");
    res.redirect("/listings");
  })
);
//delete route
router.delete(
  "/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted a  listing!");
    res.redirect("/listings");
  })
);

module.exports = router;
