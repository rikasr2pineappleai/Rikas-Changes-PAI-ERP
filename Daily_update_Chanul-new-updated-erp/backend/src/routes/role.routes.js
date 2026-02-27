// routes/role.routes.js
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');

// Routes are mounted expecting role_id in the URL.
// Example base mount in app.js: app.use('/roles', roleRoutes);

// Create a mapping (user supplies only rule_category_id in body)
router.post('/:role_id/rules', roleController.createRoleRule);

// Get all rules for a role
router.get('/:role_id/rules', roleController.getRoleRules);

// Get specific mapping
router.get('/:role_id/rules/:rule_category_id', roleController.getRoleRule);

// Update mapping (body must include new rule_category_id)
router.put('/:role_id/rules/:rule_category_id', roleController.updateRoleRule);

// Delete mapping
router.delete('/:role_id/rules/:rule_category_id', roleController.deleteRoleRule);

module.exports = router;
