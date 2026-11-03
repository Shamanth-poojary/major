const bcrypt = require("bcryptjs");
const pool   = require("../db/pool");
const User   = require("../models/user");
const OwnerProfile = require("../models/ownerProfile");
const { SELF_REGISTER_ROLES, ROLE_LABELS, BUSINESS_TYPES } = require("../utils/roles");
const { uploadBufferToCloudinary, deleteCloudinaryAsset } = require("../cloudConfig");

// signup routes
module.exports.renderSignup = (req, res) => {
  const queryRole = req.query.role;
  // Preselect only if it is a valid self-registration role; otherwise default to customer
  const selectedRole = SELF_REGISTER_ROLES.includes(queryRole) ? queryRole : "customer";
  res.render("users/signup.ejs", { selectedRole, BUSINESS_TYPES, values: {}, errors: {} });
};

// post signup
module.exports.signupUser = async (req, res, next) => {
  // req.body has already been validated and sanitised by validateUser middleware
  const { username, email, password, role, business_name, business_type, phone } = req.body;

  let profilePictureUrl = null;
  let profilePicturePublicId = null;

  const avatarFile = req.file || (req.files && req.files.profile_picture ? req.files.profile_picture[0] : null);
  if (avatarFile && avatarFile.buffer) {
    if (avatarFile.size > 2 * 1024 * 1024) {
      req.avatarUploadError = "File too large. Max 2 MB allowed.";
    } else {
      try {
        const avatarRes = await uploadBufferToCloudinary(avatarFile, "wanderlust/avatars");
        profilePictureUrl = avatarRes.url;
        profilePicturePublicId = avatarRes.publicId;
      } catch (err) {
        req.avatarUploadError = "Avatar upload failed.";
      }
    }
  } else if (avatarFile && avatarFile.path) {
    profilePictureUrl = avatarFile.path;
    profilePicturePublicId = avatarFile.filename;
  }

  if (req.avatarUploadError) {
    req.flash("info", `Profile picture upload skipped: ${req.avatarUploadError}`);
  }

  let uploadedDocs = [];
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    if (role === "owner") {
      const legalFiles = (req.files && req.files.legalDocuments) ? req.files.legalDocuments : [];
      uploadedDocs = await Promise.all(
        legalFiles.map((f) => uploadBufferToCloudinary(f, "wanderlust/owner-documents"))
      );

      // Owner: run user insert + profile insert in a single transaction
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const user = await User.create(
          {
            username,
            email,
            passwordHash,
            role: "owner",
            profilePictureUrl,
            profilePicturePublicId,
            phone,
          },
          conn
        );
        await OwnerProfile.create(
          user.id,
          {
            businessName: business_name,
            businessType: business_type,
            phone,
            documents: uploadedDocs,
          },
          conn
        );
        await conn.commit();
        // Log the owner in
        req.login({ id: user.id, username, email, role: "owner", ownerStatus: "pending" }, (err) => {
          if (err) return next(err);
          req.flash("success", "Account created. Your owner application has been sent to the admin for approval.");
          res.redirect("/owner/status");
        });
      } catch (e) {
        await conn.rollback();
        if (uploadedDocs.length > 0) {
          await Promise.all(
            uploadedDocs.map((doc) => deleteCloudinaryAsset(doc.publicId, doc.resourceType))
          ).catch(() => {});
        }
        if (profilePicturePublicId) {
          await deleteCloudinaryAsset(profilePicturePublicId, "image").catch(() => {});
        }
        throw e; // ER_DUP_ENTRY handled below
      } finally {
        conn.release();
      }
    } else {
      // Customer: simple insert
      try {
        const user = await User.create({
          username,
          email,
          passwordHash,
          role,
          profilePictureUrl,
          profilePicturePublicId,
        });
        req.login({ id: user.id, username, email, role, ownerStatus: null }, (err) => {
          if (err) return next(err);
          req.flash("success", `Welcome to Wanderlust! You are registered as ${ROLE_LABELS[role]}.`);
          res.redirect("/listings");
        });
      } catch (e) {
        if (profilePicturePublicId) {
          await deleteCloudinaryAsset(profilePicturePublicId, "image").catch(() => {});
        }
        throw e;
      }
    }
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      req.flash("error", "A user with that username or email already exists.");
      return res.redirect("/signup");
    }
    return next(e);
  }
};

// login routes
module.exports.renderLogin = (req, res) => {
  res.render("users/login.ejs");
};

module.exports.loginUser = async (req, res) => {
  req.flash("success", "Welcome back!");
  // Priority: previously requested URL > role-based default
  if (res.locals.redirectUrl) {
    return res.redirect(res.locals.redirectUrl);
  }
  const user = req.user;
  if (user.role === "admin") {
    return res.redirect("/admin/owners");
  }
  if (user.role === "owner" && user.ownerStatus !== "approved") {
    return res.redirect("/owner/status");
  }
  res.redirect("/listings");
};

// logout route - redirects to / (landing page)
module.exports.logoutUser = (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.flash("success", "Logged out successfully!");
    res.redirect("/");
  });
};
