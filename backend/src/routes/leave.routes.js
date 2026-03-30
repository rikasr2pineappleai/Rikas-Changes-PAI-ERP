// // routes/leave.routes.js
// const express = require('express');
// const router = express.Router();
// const path = require('path');
// const fs = require('fs');
// const multer = require('multer');
// const { protect, authorize } = require('../middleware/auth.middleware');

// // Require controller (match filename exactly)
// const leaveController = require('../controllers/leave.controller');

// // Ensure uploads folder exists
// const uploadDir = path.join(__dirname, '..', 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Multer storage & filter (PDF only)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}-${file.originalname}`)
// });
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/pdf') cb(null, true);
//   else cb(new Error('Only PDF files are allowed'), false);
// };
// const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// // Health check for this router (public for health monitoring)
// router.get('/ping', (req, res) => res.json({ ok: true, msg: 'leave routes alive' }));

// // POST -> create (form-data: leave_name, leave_type, pdf file named "pdf")
// // Only admin can create leave types
// router.post('/leave-type', protect, authorize('admin'), upload.single('pdf'), leaveController.create);

// // DELETE -> delete by id param
// // Only admin can delete leave types
// router.delete('/leave-type/:id', protect, authorize('admin'), leaveController.delete);

// module.exports = router;

// routes/leave.routes.js
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { protect, authorize } = require("../middleware/auth.middleware");

// Require controller (match filename exactly)
const leaveController = require("../controllers/leave.controller");

// Ensure uploads folder exists at backend/uploads/
const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage & filter (PDF only)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`
    ),
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Health check for this router (public for health monitoring)
router.get("/ping", (req, res) =>
  res.json({ ok: true, msg: "leave routes alive" })
);

// POST -> create (form-data: leave_name, leave_type, pdf file named "pdf")
// Only admin can create leave types
router.post(
  "/leave-type",
  protect,
  authorize("admin"),
  upload.single("pdf"),
  leaveController.create
);

// DELETE -> delete by id param
// Only admin can delete leave types
router.delete(
  "/leave-type/:id",
  protect,
  authorize("admin"),
  leaveController.delete
);

module.exports = router;
