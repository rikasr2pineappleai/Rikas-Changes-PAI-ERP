
const express = require('express');
const { 
  createEmployeePersonal,
  updateEmployeePersonal,
  addEmployeeEducation,
  updateEmployeeEducation,
  addEmployeeProfessional,
  updateEmployeeProfessional,
  uploadEmployeeDocument,
  uploadEmployeeProfilePhoto,
  setEmployeeWorkInfo,
  addEmployeeProjectAllocation,
  updateEmployeeProjectAllocation,
  getEmployeeOverview,
  getAllEmployees,
  getEmployeeCount,
  getNextEmployeeId,
  getEmployeeDocuments,
  updateEmployeeDocuments
} = require('../controllers/employee.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { upload, uploadConfigs } = require('../utils/fileUpload');
const router = express.Router();

// All employees
router.route('/')
  .get(protect, authorize('admin'), getAllEmployees);

// Employee count
router.route('/count')
  .get(protect, authorize('admin'), getEmployeeCount);

// Get next employee ID
router.route('/next-emp-id')
  .get(protect, authorize('admin'), getNextEmployeeId);

// Employee creation - Step 1: Personal Information
router.route('/personal')
  .post(protect, authorize('admin'), createEmployeePersonal);

// Employee update - Step 1: Personal Information
router.route('/:id/personal')
  .put(protect, authorize('admin'), updateEmployeePersonal);

// Employee education information
router.route('/:id/education')
  .post(protect, authorize('admin'), addEmployeeEducation);

// Update employee education information
router.route('/:id/education/:educationId')
  .put(protect, authorize('admin'), updateEmployeeEducation);

// Employee professional information
router.route('/:id/professional')
  .post(protect, authorize('admin'), addEmployeeProfessional);

// Update employee professional information
router.route('/:id/professional/:professionalId')
  .put(protect, authorize('admin'), updateEmployeeProfessional);

// Employee work information
router.route('/:id/work-info')
  .post(protect, authorize('admin'), setEmployeeWorkInfo);

// Project allocation routes - MUST come before the generic /:id route
router.route('/:id/project-allocation')
  .post(protect, authorize('admin'), addEmployeeProjectAllocation);

// Update project allocation
router.route('/:id/project-allocation/:allocationId')
  .put(protect, authorize('admin'), updateEmployeeProjectAllocation);

// Multer error handler for document uploads
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error("Multer error:", err);
    
    // Handle multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the maximum limit of 10MB'
      });
    }
    if (err.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many parts in the request'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files in the request'
      });
    }
    // File filter error (wrong file type)
    if (err.message && err.message.includes('Only')) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    // Generic multer error
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

// Wrapper to catch sync errors from multer
const uploadWithErrorHandling = (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds the maximum limit of 10MB'
        });
      }
      if (err.message && err.message.includes('Only')) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    next();
  });
};

// Employee document upload (POST with file upload middleware)
router.route('/:id/documents')
  .post(
    protect, 
    authorize('admin'), 
    uploadWithErrorHandling,
    uploadEmployeeDocument
  )
  .get(protect, authorize('admin', 'employee'), getEmployeeDocuments)
  .put(protect, authorize('admin'), updateEmployeeDocuments);

// Employee profile photo upload
router.route('/:id/profile-photo')
  .post(
    protect, 
    authorize('admin'), 
    uploadConfigs.profilePhoto.single('image'), 
    uploadEmployeeProfilePhoto
  );

// Employee overview (should be last to avoid catching specific routes)
router.route('/:id')
  .get(protect, authorize('admin'), getEmployeeOverview);

module.exports = router;
