const Listing = require("./models/listing");
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    //tracking the url user is requesting
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be signed in first!");
    return res.redirect("/login");
  }
  next();
};
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
    delete req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to alter this listing");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

const Review = require("./models/review");

module.exports.isReviewOwner = async (req, res, next) => {
  const { id, reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    req.flash("error", "Review not found");
    return res.redirect(`/listings/${id}`);
  }

  if (!review.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission to modify this review");
    return res.redirect(`/listings/${id}`);
  }

  next(); // ✅ user is the review owner
};
