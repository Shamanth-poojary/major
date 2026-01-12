const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const Review = require("../models/review");
//post route
module.exports.postReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) throw new ExpressError(404, "Listing not found");

  const newReview = new Review(req.body.review);
  newReview.owner = req.user._id;
  await newReview.save();

  listing.reviews.push(newReview._id);
  await listing.save();
  req.flash("success", "posted a review!");
  res.redirect(`/listings/${listing._id}`);
};
//delete route
module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, {
    $pull: { reviews: reviewId },
  });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", " review deleted !");
  res.redirect(`/listings/${id}`);
};
