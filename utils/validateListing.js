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

module.exports = function validateListing(req, res, next) {
  const { error, value } = listingSchema.validate(req.body.listing || {}, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const errors = {};
    for (const detail of error.details) {
      const key = detail.path[0] || "form";
      if (!errors[key]) errors[key] = detail.message;
    }
    // For API calls, return JSON
    if (
      req.xhr ||
      (req.headers.accept && req.headers.accept.includes("application/json"))
    ) {
      return res.status(400).json({ errors });
    }
    return res
      .status(400)
      .render("listings/new.ejs", { listing: req.body.listing, errors });
  }
  req.body.listing = value;
  next();
};
