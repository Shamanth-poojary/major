const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const Wishlist = require("../models/wishlist");

// =======================
// INDEX
// =======================
module.exports.index = async (req, res) => {
  const { search, category, minPrice, maxPrice, sort } = req.query;
  const alllistings = await Listing.findAll({ search, category, minPrice, maxPrice, sort });
  let wishlistListingIds = new Set();
  if (req.user) {
    wishlistListingIds = await Wishlist.getUserWishlistListingIds(req.user.id);
  }
  res.render("listings/index.ejs", {
    alllistings,
    wishlistListingIds,
    search: search || "",
    category: category || "all",
    sort: sort || "default",
    minPrice: minPrice || "",
    maxPrice: maxPrice || "",
  });
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

  const listing = await Listing.findByIdWithDetails(id);

  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  let isWishlisted = false;
  if (req.user) {
    isWishlisted = await Wishlist.isWishlisted(req.user.id, id);
  }

  const roomService = require("../services/roomService");
  const rooms = await roomService.getRoomsByListing(id);

  res.render("listings/show.ejs", { listing, isWishlisted, rooms });
};

// =======================
// CREATE (F4, F8)
// =======================
module.exports.postListing = async (req, res) => {
  // multer safety check
  if (!req.file) {
    req.flash("error", "Image upload failed!");
    return res.redirect("/listings/new");
  }

  // F8: Guard against no geocoder match
  let response;
  try {
    response = await geocodingClient
      .forwardGeocode({ query: req.body.listing.location, limit: 1 })
      .send();
  } catch (err) {
    req.flash("error", "Could not find that location. Please enter a valid location.");
    return res.redirect("/listings/new");
  }

  const features = response.body.features;
  if (!features || features.length === 0) {
    req.flash("error", "Could not find that location. Please enter a valid location.");
    return res.redirect("/listings/new");
  }

  const [longitude, latitude] = features[0].geometry.coordinates;
  const { title, description, price, location, country } = req.body.listing;

  const newId = await Listing.create({
    ownerId: req.user.id,
    title,
    description,
    price,
    location,
    country,
    imageUrl: req.file.path,
    imageFilename: req.file.filename,
    latitude,
    longitude,
  });

  try {
    const roomService = require("../services/roomService");
    const roomGenerator = require("../services/roomGenerator");

    let parsedRooms = [];
    if (req.body.rooms) {
      try {
        parsedRooms = typeof req.body.rooms === "string" ? JSON.parse(req.body.rooms) : req.body.rooms;
      } catch (e) {
        parsedRooms = [];
      }
    }

    if (Array.isArray(parsedRooms) && parsedRooms.length > 0) {
      for (const r of parsedRooms) {
        if (!r || !r.name || !r.name.trim()) continue;
        await roomService.createRoomType(newId, {
          name: r.name.trim(),
          description: r.description || `${r.name.trim()} at ${title}`,
          category: r.category || "standard",
          bed_config: r.bed_config || "1 Queen Bed",
          size_sqft: r.size_sqft ? parseInt(r.size_sqft, 10) : 320,
          max_guests: Math.max(1, parseInt(r.max_guests, 10) || 2),
          price_per_night: Math.max(0, parseFloat(r.price_per_night) || parseFloat(price) || 1000),
          total_units: Math.max(1, parseInt(r.total_units, 10) || 1),
          amenities: Array.isArray(r.amenities)
            ? r.amenities
            : (typeof r.amenities === "string"
                ? r.amenities.split(",").map((s) => s.trim()).filter(Boolean)
                : ["Free High-Speed WiFi", "Air Conditioning", "Hot Water & Shower"]),
          imageUrl: req.file ? req.file.path : null,
        });
      }
    } else {
      // Generate sensible default suites from listing details and base price
      const defaultRooms = roomGenerator.generateRoomTypes({
        title,
        description,
        price: parseFloat(price) || 2000,
        business_type: "hotel",
      });
      for (const dr of defaultRooms) {
        await roomService.createRoomType(newId, {
          ...dr,
          imageUrl: req.file ? req.file.path : null,
        });
      }
    }

    // Payment policy configuration
    const allowAdvance =
      req.body.policy && typeof req.body.policy.allow_advance !== "undefined"
        ? String(req.body.policy.allow_advance) === "true" ||
          req.body.policy.allow_advance === "on" ||
          req.body.policy.allow_advance === "1"
        : true;
    const advanceType = req.body.policy?.advance_type === "fixed" ? "fixed" : "percent";
    const advanceValue = Math.max(0, parseFloat(req.body.policy?.advance_value) || 25.0);

    await roomService.updatePaymentPolicy(newId, {
      allow_advance: allowAdvance,
      advance_type: advanceType,
      advance_value: advanceValue,
    });
  } catch (err) {
    // If room/policy setup fails due to missing table or non-fatal issue, do not crash creation
  }

  req.flash("success", "Listing created! Your suites, pricing, and booking policies have been configured.");
  res.redirect(`/owner/listings/${newId}/rooms`);
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
// UPDATE (F1, F8)
// =======================
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  // Fetch current listing to compare location (F8)
  const existing = await Listing.findById(id);
  if (!existing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  // F1: Only whitelisted fields from body
  const { title, description, price, location, country } = req.body.listing;

  let latitude = existing.geometry ? existing.geometry.coordinates[1] : null;
  let longitude = existing.geometry ? existing.geometry.coordinates[0] : null;

  // F8: Re-geocode only when location changed
  if (location !== existing.location) {
    try {
      const response = await geocodingClient
        .forwardGeocode({ query: location, limit: 1 })
        .send();
      const features = response.body.features;
      if (!features || features.length === 0) {
        req.flash("error", "Could not find that location. Please enter a valid location.");
        return res.redirect(`/listings/${id}/edit`);
      }
      [longitude, latitude] = features[0].geometry.coordinates;
    } catch (err) {
      req.flash("error", "Could not find that location. Please enter a valid location.");
      return res.redirect(`/listings/${id}/edit`);
    }
  }

  const updateData = { title, description, price, location, country, latitude, longitude };

  // If user uploaded a new image
  if (req.file) {
    updateData.imageUrl = req.file.path;
    updateData.imageFilename = req.file.filename;
  }

  await Listing.update(id, updateData);

  req.flash("success", "Listing edited successfully!");
  res.redirect(`/listings/${id}`);
};

// =======================
// DELETE
// =======================
module.exports.deleteListing = async (req, res) => {
  const { id } = req.params;

  await Listing.remove(id);

  req.flash("success", "Successfully deleted a listing!");
  res.redirect("/listings");
};

