const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists at backend/uploads/
const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Use absolute path to backend/uploads/
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// File filter to allow specific file types
const fileFilter = (req, file, cb) => {
  const allowedExtensions = new Set([
    ".jpeg",
    ".jpg",
    ".png",
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".xls",
    ".xlsx",
    ".csv",
  ]);
  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/csv",
    "application/octet-stream",
  ]);
  const extname = allowedExtensions.has(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.has(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images, PDFs, and documents are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

module.exports = upload;
