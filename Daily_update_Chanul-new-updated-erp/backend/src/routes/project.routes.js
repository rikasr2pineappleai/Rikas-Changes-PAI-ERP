const express = require("express");
const router = express.Router();

const {
  getProjectsDashboard,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  replaceProjectAllocations,
} = require("../controllers/project.controller");

// Dashboard list + stats
router.get("/", getProjectsDashboard);

// Single project view
router.get("/:id", getProjectById);

// CRUD
router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// Allocations
router.post("/:id/allocations", replaceProjectAllocations);

module.exports = router;