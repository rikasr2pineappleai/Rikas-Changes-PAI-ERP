const db = require("../models");
const { Task, User, Project, Notification, EmployeeDetail } = db;

// Helper: safe int
const toInt = (v) =>
  v === null || v === undefined || v === "" ? null : Number(v);

/**
 * UI status:
 * to_do, in_progress, review, cto_review, done
 *
 * DB status:
 * to_do, in_progress, testing, blocked, done, pending
 */

// ✅ Convert DB/UI/old values -> UI status
const normalizeStatus = (status) => {
  if (!status) return "to_do";

  const value = String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (value === "todo" || value === "to_do" || value === "pending") {
    return "to_do";
  }

  if (
    value === "inprogress" ||
    value === "in_progress" ||
    value === "progress"
  ) {
    return "in_progress";
  }

  if (value === "review" || value === "in_review" || value === "testing") {
    return "review";
  }

  if (value === "cto_review" || value === "blocked") {
    return "cto_review";
  }

  if (value === "complete" || value === "completed" || value === "done") {
    return "done";
  }

  return "to_do";
};

// ✅ Convert UI/old values -> DB status only
const toDbStatus = (status) => {
  if (!status) return "to_do";

  const value = String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (value === "todo" || value === "to_do" || value === "pending") {
    return "to_do";
  }

  if (
    value === "inprogress" ||
    value === "in_progress" ||
    value === "progress"
  ) {
    return "in_progress";
  }

  if (value === "review" || value === "in_review" || value === "testing") {
    return "testing";
  }

  if (value === "cto_review" || value === "blocked") {
    return "blocked";
  }

  if (value === "complete" || value === "completed" || value === "done") {
    return "done";
  }

  return "to_do";
};

// ✅ Employee allowed move sequence in DB values
const EMPLOYEE_ALLOWED_NEXT_STATUS = {
  to_do: "in_progress",
  in_progress: "testing",
  testing: "blocked",
  blocked: "done",
};

exports.getTasksByProjectId = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    const tasks = await Task.findAll({
      where: { project_id: projectId },
      order: [
        ["assigned_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    const numbered = (tasks || []).map((t, idx) => ({
      ...t.get({ plain: true }),
      task_no: idx + 1,
      status: normalizeStatus(t.status),
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

exports.getMyTasks = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId || Number.isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    const tasks = await Task.findAll({
      where: { assigned_to: userId },
      include: [
        {
          model: Project,
          attributes: ["id", "project_name"],
        },
        {
          model: User,
          as: "AssignedToUser",
          attributes: ["id", "first_name", "last_name", "designation"],
          required: false,
          include: [
            {
              model: EmployeeDetail,
              attributes: ["image_path"],
              required: false,
            },
          ],
        },
      ],
      order: [
        ["assigned_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    // Build absolute URL from the incoming request so the frontend can use
    // the returned profile pic path directly as an <img src>.
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const formatted = (tasks || []).map((task, idx) => {
      const plain = task.get({ plain: true });

      const imagePath = plain.AssignedToUser?.EmployeeDetail?.image_path || "";
      const profilePic = imagePath
        ? `${baseUrl}/${String(imagePath).replace(/^\/+/, "")}`
        : "";

      return {
        ...plain,
        task_no: idx + 1,
        status: normalizeStatus(plain.status),
        project_name: plain.Project?.project_name || "Project",
        assignee_name: plain.AssignedToUser
          ? [plain.AssignedToUser.first_name, plain.AssignedToUser.last_name]
              .filter(Boolean)
              .join(" ")
              .trim()
          : "",
        assignee_profile_pic: profilePic,
        assignee_designation: plain.AssignedToUser?.designation || "",
      };
    });

    return res.status(200).json({
      success: true,
      tasks: formatted,
    });
  } catch (error) {
    console.error("getMyTasks error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load employee tasks",
      error: error.message,
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const task = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          attributes: ["id", "project_name"],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      task: {
        ...task.get({ plain: true }),
        status: normalizeStatus(task.status),
      },
    });
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
      status: toDbStatus(body.status || "to_do"),
      deadline: body.deadline || null,
      assigner_deadline: body.assigner_deadline || null,
      staff_deadline: body.staff_deadline || null,
      assigned_at: body.assigned_at || new Date(),
      assigned_by: toInt(body.assigned_by),
    });

    // Create notification for assigned user
    await Notification.create({
      user_id: task.assigned_to,
      title: "New Task Assigned",
      message: `You have been assigned a new task: ${task.title}`,
      type: "info",
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: {
        ...task.get({ plain: true }),
        status: normalizeStatus(task.status),
      },
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
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await task.update({
      title: body.title !== undefined ? String(body.title).trim() : task.title,
      description:
        body.description !== undefined ? body.description : task.description,
      assigned_to:
        body.assigned_to !== undefined
          ? toInt(body.assigned_to)
          : task.assigned_to,
      priority: body.priority !== undefined ? body.priority : task.priority,
      status: body.status !== undefined ? toDbStatus(body.status) : task.status,
      deadline: body.deadline !== undefined ? body.deadline : task.deadline,
      assigner_deadline:
        body.assigner_deadline !== undefined
          ? body.assigner_deadline
          : task.assigner_deadline,
      staff_deadline:
        body.staff_deadline !== undefined
          ? body.staff_deadline
          : task.staff_deadline,
      assigned_at:
        body.assigned_at !== undefined ? body.assigned_at : task.assigned_at,
    });

    // Create notification if status changed
    if (body.status !== undefined) {
      await Notification.create({
        user_id: task.assigned_to,
        title: "Task Status Updated",
        message: `The status of your task "${task.title}" has been updated to ${normalizeStatus(task.status)}.`,
        type: "info",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: {
        ...task.get({ plain: true }),
        status: normalizeStatus(task.status),
      },
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

exports.moveTaskByEmployee = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const { user_id, target_status } = req.body || {};

    if (!taskId || Number.isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Valid task id is required",
      });
    }

    if (!user_id || Number.isNaN(Number(user_id))) {
      return res.status(400).json({
        success: false,
        message: "Valid user_id is required",
      });
    }

    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (Number(task.assigned_to) !== Number(user_id)) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own assigned task",
      });
    }

    const currentDbStatus = toDbStatus(task.status);
    const expectedNextDbStatus = EMPLOYEE_ALLOWED_NEXT_STATUS[currentDbStatus];
    const requestedNextDbStatus = target_status
      ? toDbStatus(target_status)
      : null;

    if (!expectedNextDbStatus) {
      return res.status(400).json({
        success: false,
        message: "This task cannot be moved further by employee",
      });
    }

    if (
      requestedNextDbStatus &&
      requestedNextDbStatus !== expectedNextDbStatus
    ) {
      return res.status(400).json({
        success: false,
        message: `Task can only move from ${normalizeStatus(
          currentDbStatus,
        )} to ${normalizeStatus(expectedNextDbStatus)}`,
      });
    }

    await task.update({
      status: expectedNextDbStatus,
    });

    // Get employee details for the notification name
    const employee = await User.findByPk(task.assigned_to);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name || ''}`.trim() : "An employee";

    // Create notification for assigner (usually admin/TL)
    await Notification.create({
      user_id: task.assigned_by,
      title: `Task Status Changed by ${employeeName}`,
      message: `${employeeName} has moved the task "${task.title}" to ${normalizeStatus(task.status)}.`,
      type: "info",
    });

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      task: {
        ...task.get({ plain: true }),
        status: normalizeStatus(task.status),
      },
    });
  } catch (error) {
    console.error("moveTaskByEmployee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error: error.message,
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await task.destroy();

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("deleteTask error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    });
  }
};