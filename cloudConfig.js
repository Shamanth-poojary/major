const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "wanderlust",
    allowedFormats: ["jpeg", "png", "jpg"],
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "wanderlust/avatars",
    allowedFormats: ["jpeg", "png", "jpg", "webp"],
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

const ALLOWED_DOC_MIMES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
const ALLOWED_AVATAR_MIMES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

const signupMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "legalDocuments") {
      const isAllowed = ALLOWED_DOC_MIMES.includes(file.mimetype) ||
        /\.(pdf|jpg|jpeg|png)$/i.test(file.originalname);
      if (isAllowed) {
        cb(null, true);
      } else {
        const err = new Error("INVALID_FILE_TYPE");
        err.code = "INVALID_FILE_TYPE";
        cb(err, false);
      }
    } else if (file.fieldname === "profile_picture") {
      const isAllowed = ALLOWED_AVATAR_MIMES.includes(file.mimetype) ||
        file.mimetype.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp)$/i.test(file.originalname);
      if (isAllowed) {
        cb(null, true);
      } else {
        const err = new Error("INVALID_AVATAR_TYPE");
        err.code = "INVALID_AVATAR_TYPE";
        cb(err, false);
      }
    } else {
      cb(null, true);
    }
  },
});

const signupUpload = (req, res, next) => {
  signupMulter.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "legalDocuments", maxCount: 5 },
  ])(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        req.uploadError = "Each file must be 5 MB or smaller";
      } else if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
        req.uploadError = "You can upload up to 5 files";
      } else if (err.code === "INVALID_FILE_TYPE" || err.message === "INVALID_FILE_TYPE") {
        req.uploadError = "Only PDF, JPG or PNG files are allowed";
      } else if (err.code === "INVALID_AVATAR_TYPE" || err.message === "INVALID_AVATAR_TYPE") {
        req.avatarUploadError = "Only JPEG, PNG, or WebP images are allowed for avatars";
      } else {
        req.uploadError = err.message || "File upload failed. Please try again";
      }
    }
    next();
  });
};

const uploadBufferToCloudinary = (file, folder = "wanderlust/owner-documents") => {
  return new Promise((resolve, reject) => {
    const isPdf = file.mimetype === "application/pdf" || /\.pdf$/i.test(file.originalname);
    const uploadOptions = {
      folder: folder,
      resource_type: isPdf ? "raw" : "auto",
    };
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (err, result) => {
      if (err) return reject(err);
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        resourceType: result.resource_type || (isPdf ? "raw" : "image"),
        uploadedAt: new Date(),
      });
    });
    stream.end(file.buffer);
  });
};

async function deleteCloudinaryAsset(publicId, resourceType = "image") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error("Cloudinary destroy error:", err.message);
  }
}

module.exports = {
  cloudinary,
  storage,
  avatarStorage,
  uploadAvatar,
  signupUpload,
  uploadBufferToCloudinary,
  deleteCloudinaryAsset,
};
