const multer = require("multer");
const path = require("path");
const ApiError = require("../Utils/ApiError");

// Storage configuration — saves files to /uploads/products/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads", "products"));
  },
  filename: (req, file, cb) => {
    // Generate unique filename: product-<timestamp>-<random>.<ext>
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

// File filter — only allow image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only image files are allowed (jpeg, jpg, png, webp, gif)"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5MB per file
  },
});

// Middleware for single product image upload
const uploadProductImage = upload.single("image");

// Error-handling wrapper for multer
const handleUpload = (req, res, next) => {
  uploadProductImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new ApiError(400, "Image size must be less than 5MB"));
      }
      return next(new ApiError(400, err.message));
    }
    if (err) {
      return next(err);
    }
    next();
  });
};

module.exports = { handleUpload };
