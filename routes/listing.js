const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const validateListing = require("../utils/validateListing");
const { isLoggedIn } = require("../middleware.js");
const { isOwner } = require("../middleware.js");
const listingController = require("../controller/listings.js");
router
  .route("/")
  .get(wrapAsync(listingController.index)) //index route
  .post(
    isLoggedIn, //post route
    validateListing,
    wrapAsync(listingController.postListing)
  );
//new route
router.get("/new", isLoggedIn, listingController.newform);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing)) //show route
  .put(
    isLoggedIn,
    isOwner,
    validateListing,
    wrapAsync(listingController.updateListing)
  ); //update route

//edit route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.editListing)
);

//delete route
router.delete(
  "/:id",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.deleteListing)
);

module.exports = router;
