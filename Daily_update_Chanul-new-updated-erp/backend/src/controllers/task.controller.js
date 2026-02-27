const db = require("../models");
const { Task, User } = db;

// Helper: safe int
const toInt = (v) =>
  v === null || v === undefined || v === "" ? null : Number(v);

exports.getTasksByProjectId = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    const tasks = await Task.findAll({
      where: { project_id: projectId },

      // ✅ Latest task first (your Task model uses assigned_at)
      order: [
        ["assigned_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    // ✅ Per-project continuous number (1..N)
    const numbered = (tasks || []).map((t, idx) => ({
      ...t.get({ plain: true }),
      task_no: idx + 1,
    }));

    return res.status(200).json({ success: true, tasks: numbered });
  } catch (error) {
    console.error("getTasksByProjectId error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load tasks",
      error: error.message,
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const task = await Task.findByPk(id);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    return res.status(200).json({ success: true, task });
  } catch (error) {
    console.error("getTaskById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load task",
      error: error.message,
    });
  }
};

exports.createTask = async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.project_id) {
      return res
        .status(400)
        .json({ success: false, message: "project_id is required" });
    }
    if (!body.title || !String(body.title).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "title is required" });
    }
    if (!body.assigned_to) {
      return res
        .status(400)
        .json({ success: false, message: "assigned_to is required" });
    }
    if (!body.assigned_by) {
      return res
        .status(400)
        .json({ success: false, message: "assigned_by is required" });
    }

    const task = await Task.create({
      project_id: toInt(body.project_id),
      title: String(body.title).trim(),
      description: body.description || null,
      assigned_to: toInt(body.assigned_to),
      priority: body.priority || "medium",
      status: body.status || "to_do",
      deadline: body.deadline || null,
      assigner_deadline: body.assigner_deadline || null,
      staff_deadline: body.staff_deadline || null,
      assigned_by: toInt(body.assigned_by),
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("createTask error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message,
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};

    const task = await Task.findByPk(id);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    // ✅ Update ALL fields (not only name)
    await task.update({
      title: body.title !== undefined ? String(body.title).trim() : task.title,
      description:
        body.description !== undefined ? body.description : task.description,
      assigned_to:
        body.assigned_to !== undefined
          ? toInt(body.assigned_to)
          : task.assigned_to,
      priority: body.priority !== undefined ? body.priority : task.priority,
      status: body.status !== undefined ? body.status : task.status,
      deadline: body.deadline !== undefined ? body.deadline : task.deadline,
      assigner_deadline:
        body.assigner_deadline !== undefined
          ? body.assigner_deadline
          : task.assigner_deadline,
      staff_deadline:
        body.staff_deadline !== undefined
          ? body.staff_deadline
          : task.staff_deadline,
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("updateTask error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const task = await Task.findByPk(id);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    await task.destroy();

    return res
      .status(200)
      .json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("deleteTask error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    });
  }
};