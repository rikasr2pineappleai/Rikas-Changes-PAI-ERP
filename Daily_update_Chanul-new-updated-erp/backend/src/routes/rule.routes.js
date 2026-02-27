// routes/rule.routes.js
const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/rule.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Get all rules (optional: ?category_id=)
// Anyone can view rules
router.get('/rules', ruleController.getAll);

// Get single rule by id
// Anyone can view a single rule
router.get('/rules/:id', ruleController.getOne);

// Create a rule
// Only admin can create rules
router.post('/rules', protect, authorize('admin'), ruleController.create);

// Update a rule by id
// Only admin can update rules
router.put('/rules/:id', protect, authorize('admin'), ruleController.update);

// Delete a rule by id
// Only admin can delete rules
router.delete('/rules/:id', protect, authorize('admin'), ruleController.delete);

module.exports = router;
