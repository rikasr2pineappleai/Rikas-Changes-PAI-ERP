// Import Express
// Express is used to create backend routes
const express = require("express");

// Create a new router object
// This router will contain all project-related routes
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");

// Import controller functions
// These functions contain the actual backend logic
// for handling project requests
const {
  getProjectsDashboard,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  replaceProjectAllocations,
} = require("../controllers/project.controller");

// Route: Get all projects dashboard data
// This route is used to load:
// 1. project list
// 2. dashboard statistics
// Example URL: GET /projects
router.get("/", getProjectsDashboard);

// Route: Get single project by ID
// This route is used to load one project’s details
// Example URL: GET /projects/5
router.get("/:id", getProjectById);

// Route: Create new project
// This route is used to add a new project
// Example URL: POST /projects
router.post("/", protect, authorize("admin"), createProject);

// Route: Update existing project
// This route is used to update a project by ID
// Example URL: PUT /projects/5
router.put("/:id", updateProject);

// Route: Delete a project
// This route is used to delete a project by ID
// Example URL: DELETE /projects/5
router.delete("/:id", deleteProject);

// Route: Replace project allocations / members
// This route is used to update project members
// for a selected project
// Example URL: POST /projects/5/allocations
router.post("/:id/allocations", replaceProjectAllocations);

// Export router
// Export this router so it can be used in app.js or server.js
module.exports = router;
