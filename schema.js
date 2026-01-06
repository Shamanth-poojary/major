const Joi = require("joi");

const listingSchema = Joi.object({
  title: Joi.string().trim().min(1).required().messages({
    "string.empty": "Title is required.",
  }),
  description: Joi.string().trim().min(1).required().messages({
    "string.empty": "Description is required.",
  }),
  image: Joi.string()
    .uri()
    .allow("")
    .messages({ "string.uri": "Image must be a valid URL." }),
  price: Joi.number().min(0).required().messages({
    "number.base": "Price must be a number.",
    "number.min": "Price cannot be negative.",
    "any.required": "Price is required.",
  }),
  location: Joi.string()
    .trim()
    .required()
    .messages({ "string.empty": "Location is required." }),
  country: Joi.string()
    .trim()
    .required()
    .messages({ "string.empty": "Country is required." }),
});
module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().trim().min(1).required().messages({
      "string.empty": "Comment is required.",
    }),
  }).required(),
});
