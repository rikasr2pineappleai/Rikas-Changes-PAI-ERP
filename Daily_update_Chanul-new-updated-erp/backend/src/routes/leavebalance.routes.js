// // routes/leavebalance.routes.js
// const express = require('express');
// const router = express.Router();
// const leaveBalanceController = require('../controllers/leavebalance.controller');
// const { protect, authorize } = require('../middleware/auth.middleware');

// // GET list
// // Only admin can get all leave balances
// router.get('/', protect, authorize('admin'), leaveBalanceController.getAll);

// // GET single
// // Only admin can get a single leave balance
// router.get('/:id', protect, authorize('admin'), leaveBalanceController.getById);

// // Manual move from leave request -> leave_balance
// // Only admin can manually move leave balances
// router.post('/move-from-request', protect, authorize('admin'), leaveBalanceController.moveFromRequest);

// // Manual revert
// // Only admin can manually revert leave balances
// router.post('/revert-from-request', protect, authorize('admin'), leaveBalanceController.revertFromRequest);

// module.exports = router;

// routes/leavebalance.routes.js
const express = require('express');
const router = express.Router();
const leaveBalanceController = require('../controllers/leavebalance.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// GET list
// Only admin can get all leave balances
router.get('/', protect, authorize('admin'), leaveBalanceController.getAll);

// GET single
// Only admin can get a single leave balance
router.get('/:id', protect, authorize('admin'), leaveBalanceController.getById);

// Manual move from leave request -> leave_balance
// Only admin can manually move leave balances
router.post('/move-from-request', protect, authorize('admin'), leaveBalanceController.moveFromRequest);

// Manual revert
// Only admin can manually revert leave balances
router.post('/revert-from-request', protect, authorize('admin'), leaveBalanceController.revertFromRequest);

// GET user-specific leave balances
// User can get their own, admin can get any user's balances
router.get('/user/:userId', protect, leaveBalanceController.getByUser);

// GET user-specific leave balance summary (for pie charts)
// User can get their own, admin can get any user's summary
router.get('/user/:userId/summary', protect, leaveBalanceController.getUserBalanceSummary);

module.exports = router;
