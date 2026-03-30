const express = require('express');
const { 
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/department.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All department routes require authentication
router.use(protect);

// Public routes (accessible to authenticated users)
router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);

// Admin only routes
router.post('/', authorize('admin'), createDepartment);
router.put('/:id', authorize('admin'), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

module.exports = router;