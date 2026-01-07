const express = require("express");
const router = express.Router({ mergeParams: true }); //so that we can access :id from parent route
const wrapAsync = require("../utils/wrapAsync");

const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const Review = require("../models/review");
const validateReview = require("../utils/validateReview");
//review section
//post route
router.post(
  "/",
  validateReview,
  wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new ExpressError(404, "Listing not found");

    const newReview = new Review(req.body.review);
    await newReview.save();

    listing.reviews.push(newReview._id);
    await listing.save();
    req.flash("success", "posted a review!");
    res.redirect(`/listings/${listing._id}`);
  })
);
//review delete route
router.delete(
  "/:reviewId",
  wrapAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId },
    });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", " review deleted !");
    res.redirect(`/listings/${id}`);
  })
);
module.exports = router;
