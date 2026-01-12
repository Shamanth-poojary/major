const Listing = require("../models/listing");
//index route
module.exports.index = async (req, res) => {
  const alllistings = await Listing.find({});
  res.render("listings/index.ejs", { alllistings });
};

//new route
module.exports.newform = (req, res) => {
  res.render("listings/new.ejs");
};
//show route
module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "owner", // 👈 populate review.owner
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};
//post route
module.exports.postListing = async (req, res) => {
  const newlisting = new Listing(req.body.listing);
  newlisting.owner = req.user._id;
  await newlisting.save();
  req.flash("success", "Successfully created a new listing!");
  res.redirect("/listings");
};
//edit route
module.exports.editListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};
//update route
module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  await Listing.findByIdAndUpdate(id, {
    ...req.body.listing,
  });

  req.flash("success", "Listing edited successfully!");
  res.redirect(`/listings/${id}`);
};
//delete route
module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Successfully deleted a  listing!");
  res.redirect("/listings");
};
