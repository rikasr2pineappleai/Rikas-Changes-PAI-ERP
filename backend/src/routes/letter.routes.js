const express = require('express');
const {
  generateOfferLetterPDF,
  generateOfferLetterPreview,
  sendOfferLetterEmail,
  generateServiceLetterPDF,
  generateServiceLetterPreview,
  sendServiceLetterEmail,
  saveOfferLetterTemplate,
  saveServiceLetterTemplate,
  getOfferLetterTemplates,
  getServiceLetterTemplates,
  getEmployeeDetailsForOfferLetter,
  getAllEmployeesForDropdown,
  debugListAllEmployees,
  getAllEmployeesForServiceLetterDropdown,
  getEmployeeDetailsForServiceLetter,
  debugServiceLetterEmployees,
  getAllLetters,
  deleteLetter
} = require('../controllers/letter.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All Letters Records (Offer + Service Letters)
router.route('/letters')
  .get(protect, authorize('admin'), getAllLetters);

router.route('/debug/letters')
  .get(getAllLetters);

router.route('/letters/:documentType/:id')
  .delete(protect, authorize('admin'), deleteLetter);

// Offer Letter Routes - Specific routes first
router.route('/offer-letter/generate')
  .post(protect, authorize('admin'), generateOfferLetterPDF);

router.route('/offer-letter/preview')
  .post(protect, authorize('admin'), generateOfferLetterPreview);

router.route('/offer-letter/email')
  .post(protect, authorize('admin'), sendOfferLetterEmail);

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

router.route('/service-letter/email')
  .post(protect, authorize('admin'), sendServiceLetterEmail);

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
