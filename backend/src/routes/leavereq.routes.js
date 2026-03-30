// routes/leavereq.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const leavereqController = require('../controllers/leavereq.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// ensure uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// File filter to allow specific file types
const fileFilter = (req, file, cb) => {
  // Accept images, pdfs, and document files
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

// multer config
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

/**
 * =========================
 * CREATE LEAVE REQUESTS
 * =========================
 */

// Standard leave request
router.post(
  '/leave-request',
  protect,
  upload.single('document'),
  leavereqController.create
);

// Compulsory leave
router.post(
  '/leave-request/compulsory',
  protect,
  upload.single('document'),
  leavereqController.createCompulsoryLeave
);

// Half-day leave
router.post(
  '/leave-request/halfday',
  protect,
  upload.single('document'),
  leavereqController.createHalfdayLeave
);

// Hours-permission leave
router.post(
  '/leave-request/hours-permission',
  protect,
  upload.single('document'),
  leavereqController.createHoursPermissionLeave
);

/**
 * =========================
 * GET REQUESTS
 * =========================
 */

// User-specific leave requests
// User → own requests | Admin → any user
router.get(
  '/leave-request/user/:userId',
  protect,
  leavereqController.getByUser
);

// User calendar data
router.get(
  '/leave-request/user/:userId/calendar',
  protect,
  leavereqController.getUserCalendarData
);

// Admin: get all leave requests
router.get(
  '/leave-request',
  protect,
  authorize('admin'),
  leavereqController.getAll
);

// Get leave request by ID
router.get(
  '/leave-request/:id',
  protect,
  leavereqController.getById
);

// Get leave request document
router.get(
  '/leave-request/:id/document',
  protect,
  leavereqController.getLeaveDocument
);

/**
 * =========================
 * UPDATE
 * =========================
 */

// Update leave status (admin only)
router.put(
  '/leave-request/:id/status',
  protect,
  authorize('admin'),
  leavereqController.updateStatus
);

// ✅ NEW: Update admin reason (admin only)
router.put(
  '/leave-request/:id/admin-reason',
  protect,
  authorize('admin'),
  leavereqController.updateAdminReason
);

/**
 * =========================
 * DELETE
 * =========================
 */

// Delete leave request (admin only)
router.delete(
  '/leave-request/:id',
  protect,
  authorize('admin'),
  leavereqController.delete
);

module.exports = router;
