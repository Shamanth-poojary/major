const express = require("express");
const router  = express.Router();

const wrapAsync       = require("../utils/wrapAsync");
const validateListing = require("../utils/validateListing");
const { isLoggedIn, isOwner, isApprovedOwner } = require("../middleware.js");

const listingController = require("../controller/listings.js");
const bookingController = require("../controller/bookings.js");
const roomService       = require("../services/roomService.js");

const multer        = require("multer");
const { storage }   = require("../cloudConfig.js");
const upload        = multer({ storage });

// =======================
// INDEX (public)
// =======================
router.get("/", wrapAsync(listingController.index));

// =======================
// NEW FORM
// =======================
router.get("/new", isLoggedIn, isApprovedOwner, listingController.newform);

// =======================
// CREATE
// =======================
router.post(
  "/",
  isLoggedIn,
  isApprovedOwner,
  upload.single("image"),
  validateListing,
  wrapAsync(listingController.postListing)
);

// =======================
// ROOMS & BOOKING
// =======================
router.get("/:id/availability", wrapAsync(bookingController.getAvailability));
router.post("/:id/quote", wrapAsync(bookingController.getQuote));
router.get("/:id/book", isLoggedIn, wrapAsync(bookingController.renderBookingPage));
router.get("/:id/rooms", wrapAsync(async (req, res) => {
  const rooms = await roomService.getRoomsByListing(req.params.id);
  res.json(rooms);
}));

// =======================
// SHOW (public)
// =======================
router.get("/:id", wrapAsync(listingController.showListing));

// =======================
// EDIT FORM
// =======================
router.get(
  "/:id/edit",
  isLoggedIn,
  isApprovedOwner,
  isOwner,
  wrapAsync(listingController.editListing)
);

// =======================
// UPDATE
// =======================
router.put(
  "/:id",
  isLoggedIn,
  isApprovedOwner,
  isOwner,
  upload.single("image"),
  validateListing,
  wrapAsync(listingController.updateListing)
);

// =======================
// DELETE
// =======================
router.delete(
  "/:id",
  isLoggedIn,
  isApprovedOwner,
  isOwner,
  wrapAsync(listingController.deleteListing)
);

module.exports = router;
