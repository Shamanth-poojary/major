/**
 * utils/validateUser.js
 * Joi validation middleware for the signup form and the owner application form.
 */

"use strict";

const Joi = require("joi");
const { SELF_REGISTER_ROLES, BUSINESS_TYPES } = require("./roles");

const VALID_BUSINESS_TYPES = Object.keys(BUSINESS_TYPES);

// Owner-specific fields required when role is 'owner'
const ownerFields = {
  business_name: Joi.string().trim().min(2).max(100).required(),
  business_type: Joi.string().valid(...VALID_BUSINESS_TYPES).required(),
  phone:         Joi.string().trim().pattern(/^\+?[0-9]{10,15}$/).required(),
};

// Stripped fields for non-owner registrations
const strippedOwnerFields = {
  business_name: Joi.any().strip(),
  business_type: Joi.any().strip(),
  phone:         Joi.any().strip(),
};

const signupSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).required(),
  email:    Joi.string().trim().email().max(255).required(),
  password: Joi.string().min(8).max(72).required(),
  role:     Joi.string().valid(...SELF_REGISTER_ROLES).default("customer"),
}).when(
  Joi.object({ role: Joi.string().valid("owner").required() }).unknown(),
  {
    then:      Joi.object(ownerFields),
    otherwise: Joi.object(strippedOwnerFields),
  }
);

module.exports.validateUser = (req, res, next) => {
  const { error, value } = signupSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  const errors = {};
  if (error) {
    for (const d of error.details) {
      const field = d.path[0];
      if (!errors[field]) {
        if (field === "role") {
          errors[field] = "Please choose a valid account type.";
        } else {
          errors[field] = d.message.replace(/"/g, "");
        }
      }
    }
  }

  const role = req.body?.role || value?.role;
  if (role === "owner") {
    const files = req.files?.legalDocuments || [];
    if (req.uploadError) {
      errors.legalDocuments = req.uploadError;
    } else if (!files || files.length === 0) {
      errors.legalDocuments = "Please upload at least one legal document";
    } else if (files.length > 5) {
      errors.legalDocuments = "You can upload up to 5 files";
    }
  }

  if (Object.keys(errors).length > 0) {
    const submittedRole = typeof req.body?.role === "string" ? req.body.role : "";
    const selectedRole = SELF_REGISTER_ROLES.includes(submittedRole) ? submittedRole : "customer";
    const { password, confirmPassword, ...safeValues } = req.body || {};

    res.locals.error = ["Please fix the highlighted fields."];

    return res.status(400).render("users/signup.ejs", {
      selectedRole,
      BUSINESS_TYPES,
      values: safeValues,
      errors,
    });
  }

  req.body = value; // only validated fields continue
  next();
};

/**
 * Joi schema and middleware for the owner application form
 * (POST /owner/application).
 */
const ownerApplicationSchema = Joi.object({
  business_name: Joi.string().trim().min(2).max(100).required(),
  business_type: Joi.string().valid(...VALID_BUSINESS_TYPES).required(),
  phone:         Joi.string().trim().pattern(/^\+?[0-9]{10,15}$/).required(),
});

module.exports.validateOwnerApplication = (req, res, next) => {
  const { error, value } = ownerApplicationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const msg = error.details.map((d) => d.message).join(", ");
    req.flash("error", msg);
    return res.redirect("/owner/status");
  }

  req.body = value;
  next();
};
