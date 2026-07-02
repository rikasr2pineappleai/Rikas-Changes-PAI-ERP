const express = require("express");
const upload = require("../middleware/upload.middleware");
const { protect } = require("../middleware/auth.middleware");
const { sendMessage } = require("../controllers/message.controller");

const router = express.Router();

const uploadAttachments = (req, res, next) => {
  upload.array("attachments", 10)(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds the maximum limit of 10MB",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed",
    });
  });
};

router.post("/send", protect, uploadAttachments, sendMessage);

module.exports = router;
