// routes/rulecategory.routes.js
const express = require('express');
const router = express.Router();
const ruleCategoryController = require('../controllers/rulecategory.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Create a new rule category
// POST http://<host>:<port>/api/rule-category
// Only admin can create rule categories
router.post('/rule-category', protect, authorize('admin'), ruleCategoryController.create);

// Delete a rule category by id
// DELETE http://<host>:<port>/api/rule-category/:id
// Only admin can delete rule categories
router.delete('/rule-category/:id', protect, authorize('admin'), ruleCategoryController.delete);

module.exports = router;
