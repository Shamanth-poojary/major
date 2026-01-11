const mongoose = require("mongoose");
const Review = require("./review"); // FIX: capital R
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
  },

  image: {
    type: String,
    default:
      "https://cdn.pixabay.com/photo/2025/09/10/14/35/mushroom-9826526_1280.jpg",
    set: (v) =>
      v === ""
        ? "https://cdn.pixabay.com/photo/2025/09/10/14/35/mushroom-9826526_1280.jpg"
        : v,
  },

  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"],
    set: (v) => Math.round(v * 100) / 100,
  },

  location: String,
  country: String,

  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

/* Review deletion  middleware */
listingSchema.post("findOneAndDelete", async function (listing) {
  if (listing) {
    await Review.deleteMany({
      _id: { $in: listing.reviews },
    });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
