/**
 * controller/owner.js
 * Handles the owner status page and application form.
 */

"use strict";

const OwnerProfile = require("../models/ownerProfile");
const { BUSINESS_TYPES, OWNER_STATUS_LABELS } = require("../utils/roles");
const { uploadBufferToCloudinary } = require("../cloudConfig");

/**
 * GET /owner/status
 * Shows the owner their application status and, where appropriate,
 * the form to submit or re-submit business details.
 */
module.exports.renderStatus = async (req, res) => {
  const profile = await OwnerProfile.findByUserId(req.user.id);
  const status  = profile ? profile.status : "none";
  res.render("owner/status.ejs", { profile, status, BUSINESS_TYPES, OWNER_STATUS_LABELS });
};

/**
 * POST /owner/application
 * Creates a new pending profile (status none) or re-applies (status rejected or info_requested).
 * Pending and approved owners get an info flash and no change.
 */
module.exports.submitApplication = async (req, res) => {
  if (req.uploadError) {
    req.flash("error", req.uploadError);
    return res.redirect("/owner/status");
  }

  const body = req.body || {};
  const { business_name, business_type, phone } = body;
  const profile = await OwnerProfile.findByUserId(req.user.id);
  const status  = profile ? profile.status : "none";

  if (status === "pending" || status === "approved") {
    req.flash("info", `Your application is already ${status}.`);
    return res.redirect("/owner/status");
  }

  // Upload any new documents to Cloudinary
  const newFiles = (req.files && req.files.legalDocuments) ? req.files.legalDocuments : [];
  let uploadedDocs = [];
  if (newFiles.length > 0) {
    uploadedDocs = await Promise.all(
      newFiles.map((f) => uploadBufferToCloudinary(f, "wanderlust/owner-documents"))
    );
  }

  if (status === "none") {
    await OwnerProfile.create(
      req.user.id,
      { businessName: business_name, businessType: business_type, phone, documents: uploadedDocs }
    );
    req.flash("success", "Your application has been sent to the admin for approval.");
  } else {
    // rejected or info_requested: re-apply
    await OwnerProfile.reapply(
      req.user.id,
      { businessName: business_name, businessType: business_type, phone, documents: uploadedDocs }
    );
    if (status === "info_requested") {
      req.flash("success", "Additional documents submitted. Your application is under review.");
    } else {
      req.flash("success", "Your application has been sent to the admin for approval.");
    }
  }

  res.redirect("/owner/status");
};
