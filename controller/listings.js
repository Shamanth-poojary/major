const Listing = require("../models/listing");

// =======================
// INDEX
// =======================
module.exports.index = async (req, res) => {
  const alllistings = await Listing.find({});
  res.render("listings/index.ejs", { alllistings });
};

// =======================
// NEW FORM
// =======================
module.exports.newform = (req, res) => {
  res.render("listings/new.ejs");
};

// =======================
// SHOW
// =======================
module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "owner" },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// =======================
// CREATE
// =======================
module.exports.postListing = async (req, res) => {
  // multer safety check
  if (!req.file) {
    req.flash("error", "Image upload failed!");
    return res.redirect("/listings/new");
  }

  const { path: url, filename } = req.file;

  const newlisting = new Listing(req.body.listing);
  newlisting.owner = req.user._id;
  newlisting.image = { url, filename };

  await newlisting.save();

  req.flash("success", "Successfully created a new listing!");
  res.redirect("/listings");
};

// =======================
// EDIT FORM
// =======================
module.exports.editListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  res.render("listings/edit.ejs", { listing });
};

// =======================
// UPDATE
// =======================
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true }
  );

  // If user uploaded a new image
  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await listing.save();
  }

  req.flash("success", "Listing edited successfully!");
  res.redirect(`/listings/${id}`);
};

// =======================
// DELETE
// =======================
module.exports.deleteListing = async (req, res) => {
  const { id } = req.params;

  await Listing.findByIdAndDelete(id);

  req.flash("success", "Successfully deleted a listing!");
  res.redirect("/listings");
};
