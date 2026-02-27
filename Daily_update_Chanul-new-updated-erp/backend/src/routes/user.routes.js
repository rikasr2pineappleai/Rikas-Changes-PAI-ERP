const express = require('express');
const { getUsersForAssignment } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all users for assignment purposes (with first_name and relevant fields)
router.route('/for-assignment')
  .get(protect, getUsersForAssignment);

module.exports = router;