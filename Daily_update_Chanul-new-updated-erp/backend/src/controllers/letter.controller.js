// This file now serves as a re-export module
// Import from separated controllers
const offerLetterController = require('./offerLetter.controller');
const serviceLetterController = require('./serviceLetter.controller');

// Re-export Offer Letter functions
exports.generateOfferLetterPDF = offerLetterController.generateOfferLetterPDF;
exports.saveOfferLetterTemplate = offerLetterController.saveOfferLetterTemplate;
exports.getOfferLetterTemplates = offerLetterController.getOfferLetterTemplates;
exports.getEmployeeDetailsForOfferLetter = offerLetterController.getEmployeeDetailsForOfferLetter;
exports.getAllEmployeesForDropdown = offerLetterController.getAllEmployeesForDropdown;
exports.debugListAllEmployees = offerLetterController.debugListAllEmployees;

// Re-export Service Letter functions
exports.generateServiceLetterPDF = serviceLetterController.generateServiceLetterPDF;
exports.saveServiceLetterTemplate = serviceLetterController.saveServiceLetterTemplate;
exports.getServiceLetterTemplates = serviceLetterController.getServiceLetterTemplates;
exports.getAllEmployeesForServiceLetterDropdown = serviceLetterController.getAllEmployeesForServiceLetterDropdown;
exports.getEmployeeDetailsForServiceLetter = serviceLetterController.getEmployeeDetailsForServiceLetter;
exports.debugServiceLetterEmployees = serviceLetterController.debugServiceLetterEmployees;