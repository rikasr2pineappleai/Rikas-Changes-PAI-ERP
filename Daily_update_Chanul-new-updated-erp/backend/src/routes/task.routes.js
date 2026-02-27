const express = require("express");
const router = express.Router();

const taskController = require("../controllers/task.controller");

// ✅ health check (optional)
router.get("/ping", (req, res) => res.json({ ok: true }));

// ✅ GET tasks by project (newest first + numbering from controller)
router.get("/project/:projectId", taskController.getTasksByProjectId);

// ✅ CRUD
router.get("/:id", taskController.getTaskById);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;