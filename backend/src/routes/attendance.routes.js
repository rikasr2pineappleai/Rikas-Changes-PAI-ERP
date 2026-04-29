// const express = require('express');
// const { 
//   clockIn,
//   clockOut,
//   startBreak,
//   endBreak,
//   getTodayAttendance,
//   getAttendanceSummary,
//   getAllAttendanceRecords,
//   getEmployeeAttendanceRecords,
//   getAllEmployeesAttendanceRecords,
//   getAttendanceTrends,
//   getAttendanceByDepartment
// } = require('../controllers/attendance.controller');
// const { protect, authorize } = require('../middleware/auth.middleware');

// const router = express.Router();

// // Employee routes
// router.route('/employee/clock-in')
//   .post(protect, clockIn);

// router.route('/employee/clock-out')
//   .post(protect, clockOut);

// router.route('/employee/start-break')
//   .post(protect, startBreak);

// router.route('/employee/end-break')
//   .post(protect, endBreak);

// router.route('/employee/today')
//   .get(protect, getTodayAttendance);

// router.route('/employee/summary')
//   .get(protect, getAttendanceSummary);

// // Admin routes
// router.route('/admin/records')
//   .get(protect, authorize('admin'), getAllAttendanceRecords);

// router.route('/admin/records/:userId')
//   .get(protect, authorize('admin'), getEmployeeAttendanceRecords);

// router.route('/admin/records/all')
//   .get(protect, authorize('admin'), getAllEmployeesAttendanceRecords);

// router.route('/admin/analytics/trends')
//   .get(protect, authorize('admin'), getAttendanceTrends);

// router.route('/admin/analytics/departments')
//   .get(protect, authorize('admin'), getAttendanceByDepartment);

// module.exports = router;


const express = require('express');
const { 
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getTodayAttendance,
  getAttendanceSummary,
  getAllAttendanceRecords,
  getEmployeeAttendanceRecords,
  getAllEmployeesAttendanceRecords,
  getAttendanceTrends,
  getAttendanceByDepartment,
  getTodayAttendanceCount,
  getEmployeeById
} = require('../controllers/attendance.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Employee routes
router.route('/employee/clock-in')
  .post(protect, clockIn);

router.route('/employee/clock-out')
  .post(protect, clockOut);

router.route('/employee/start-break')
  .post(protect, startBreak);

router.route('/employee/end-break')
  .post(protect, endBreak);

router.route('/employee/today')
  .get(protect, getTodayAttendance);

router.route('/employee/summary')
  .get(protect, getAttendanceSummary);

// Admin routes
router.route('/admin/records')
  .get(protect, authorize('admin'), getAllAttendanceRecords);

router.route('/admin/employee/:employeeId')
  .get(protect, authorize('admin'), getEmployeeById);

router.route('/admin/records/all')
  .get(protect, authorize('admin'), getAllEmployeesAttendanceRecords);

router.route('/admin/records/:userId')
  .get(protect, authorize('admin'), getEmployeeAttendanceRecords);

router.route('/admin/analytics/trends')
  .get(protect, authorize('admin'), getAttendanceTrends);

router.route('/admin/analytics/departments')
  .get(protect, authorize('admin'), getAttendanceByDepartment);

router.route('/admin/analytics/today-count')
  .get(protect, authorize('admin'), getTodayAttendanceCount);

module.exports = router;
