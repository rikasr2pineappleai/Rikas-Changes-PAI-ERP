const express = require("express");
const router = express.Router();

const taskController = require("../controllers/task.controller");

// ✅ health check (optional)
router.get("/ping", (req, res) => res.json({ ok: true }));

// ✅ GET tasks by project (newest first + numbering from controller)
router.get("/project/:projectId", taskController.getTasksByProjectId);
router.get("/my/:userId", taskController.getMyTasks);

// ✅ CRUD
router.get("/:id", taskController.getTaskById);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.put("/:id/employee-move", taskController.moveTaskByEmployee);
router.delete("/:id", taskController.deleteTask);

module.exports = router;