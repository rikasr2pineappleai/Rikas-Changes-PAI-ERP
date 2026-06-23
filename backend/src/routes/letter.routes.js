const express = require('express');
const {
  generateOfferLetterPDF,
  generateOfferLetterPreview,
  generateServiceLetterPDF,
  generateServiceLetterPreview,
  saveOfferLetterTemplate,
  saveServiceLetterTemplate,
  getOfferLetterTemplates,
  getServiceLetterTemplates,
  getEmployeeDetailsForOfferLetter,
  getAllEmployeesForDropdown,
  debugListAllEmployees,
  getAllEmployeesForServiceLetterDropdown,
  getEmployeeDetailsForServiceLetter,
  debugServiceLetterEmployees
} = require('../controllers/letter.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Offer Letter Routes - Specific routes first
router.route('/offer-letter/generate')
  .post(protect, authorize('admin'), generateOfferLetterPDF);

router.route('/offer-letter/preview')
  .post(protect, authorize('admin'), generateOfferLetterPreview);

router.route('/offer-letter/template')
  .post(protect, authorize('admin'), saveOfferLetterTemplate);

router.route('/offer-letter/templates')
  .get(protect, authorize('admin'), getOfferLetterTemplates);

// Get all employees for dropdown
router.route('/offer-letter/all-employees')
  .get(protect, authorize('admin'), getAllEmployeesForDropdown);

// DEBUG: List all employees (static route before :id parameter)
router.route('/offer-letter/debug/list-all-employees')
  .get(protect, authorize('admin'), debugListAllEmployees);

// Generic route with parameters (must be last)
router.route('/offer-letter/employee/:employee_id')
  .get(protect, authorize('admin'), getEmployeeDetailsForOfferLetter);

// Service Letter Routes - Specific routes first
router.route('/service-letter/generate')
  .post(protect, authorize('admin'), generateServiceLetterPDF);

router.route('/service-letter/preview')
  .post(protect, authorize('admin'), generateServiceLetterPreview);

router.route('/service-letter/template')
  .post(protect, authorize('admin'), saveServiceLetterTemplate);

router.route('/service-letter/templates')
  .get(protect, authorize('admin'), getServiceLetterTemplates);

// Get all employees for dropdown
router.route('/service-letter/all-employees')
  .get(protect, authorize('admin'), getAllEmployeesForServiceLetterDropdown);

// DEBUG: Get all employees for dropdown (no auth required)
router.route('/service-letter/debug/all-employees')
  .get(debugServiceLetterEmployees);

// Generic route with parameters (must be last)
router.route('/service-letter/employee/:employee_id')
  .get(protect, authorize('admin'), getEmployeeDetailsForServiceLetter);

module.exports = router;
