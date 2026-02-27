const express = require('express');
const {
  submitRatings,
  getEmployeeRatings,
  getRatingRemarks,
  getRaterRatings,
  updateRating,
  deleteRating,
  getAllRatings
} = require('../controllers/rating.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   GET /api/ratings/debug/all
 * @desc    Debug endpoint - Get all ratings in database
 * @access  Admin only
 * NOTE: This route MUST come before :ratingId routes
 */
router.get('/debug/all', protect, authorize('admin'), getAllRatings);

/**
 * @route   GET /api/ratings/my-ratings
 * @desc    Get all ratings given by current user
 * @access  Admin only
 * NOTE: This route MUST come before :employeeId routes
 */
router.get('/my-ratings', protect, authorize('admin'), getRaterRatings);

/**
 * @route   POST /api/ratings/employee/:employeeId
 * @desc    Submit ratings for an employee
 * @access  Admin only
 */
router.post('/employee/:employeeId', protect, authorize('admin'), submitRatings);

/**
 * @route   GET /api/ratings/employee/:employeeId
 * @desc    Get all ratings for an employee
 * @access  Admin and Employee (can view own ratings)
 */
router.get('/employee/:employeeId', protect, getEmployeeRatings);

/**
 * @route   GET /api/ratings/employee/:employeeId/remarks/:criteria
 * @desc    Get remarks for a specific criteria
 * @access  Admin and Employee (can view own ratings)
 */
router.get('/employee/:employeeId/remarks/:criteria', protect, getRatingRemarks);

/**
 * @route   PUT /api/ratings/:ratingId
 * @desc    Update a specific rating
 * @access  Admin or the rater who created it
 */
router.put('/:ratingId', protect, updateRating);

/**
 * @route   DELETE /api/ratings/:ratingId
 * @desc    Delete a specific rating
 * @access  Admin or the rater who created it
 */
router.delete('/:ratingId', protect, deleteRating);

module.exports = router;