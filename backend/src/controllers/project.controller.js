// Import Sequelize operators
const { Op } = require("sequelize");

// Import all database models
const db = require("../models");

// Get needed models from DB
const { Project, ProjectAllocation, User, Task } = db;

// Helper: build a readable name from User table
const userFullName = (u) => {
  if (!u) return null;
  return [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
};

// Helper: convert date to ISO string (YYYY-MM-DD)
const toISODateOnly = (d) => {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
};

// ✅ Map DB Task -> Frontend Task format (from ViewProject.js expects these keys)
const mapTaskForFrontend = (t) => ({
  id: t.id,
// Task title for frontend
  task_name: t.title || "Task",
// End / Due Dates
  start_date: t.assigned_at ? toISODateOnly(t.assigned_at) : null,

  end_date: t.deadline ? toISODateOnly(t.deadline) : null,
  due_date: t.deadline ? toISODateOnly(t.deadline) : null,
  deadline: t.deadline ? toISODateOnly(t.deadline) : null,

  // Other Task details
  assigned_to: t.assigned_to,
  priority: t.priority,
  status: t.status,
  description: t.description || "",
});

// Decide project manager:
// 1) allocation role contains "manager" (case-insensitive)
// 2) fallback pm_user_id
// 3) fallback first allocation
const pickManagerFromProject = async (projectId, pm_user_id = null) => {
  // Get all allocations for the project
  const allocations = await ProjectAllocation.findAll({
    where: { project_id: projectId },
    include: [
      {
        model: User,
        attributes: ["id", "emp_id", "first_name", "last_name", "email"],
      },
    ],
    order: [["id", "ASC"]],
  });

  // Find allocation with role containing "manager"
  const managerAlloc =
    allocations.find((a) =>
      String(a.role_in_project || "")
        .toLowerCase()
        .includes("manager")
    ) || null;

    // If manager allocation found, return that user
  if (managerAlloc?.User) return managerAlloc.User;

  // If pm_user_id provided, return that user
  if (pm_user_id) {
    const pm = await User.findByPk(pm_user_id, {
      attributes: ["id", "emp_id", "first_name", "last_name", "email"],
    });
    if (pm) return pm;
  }

  // If no manager found, return the first allocation
  return allocations[0]?.User || null;
};

// Convert project DB data to dashboard format
const mapProjectForDashboard = async (project) => {
  // Find project manager from project details
  const managerUser = await pickManagerFromProject(
    project.id,
    project.pm_user_id
  );

  return {
    id: project.id,
    project_name: project.project_name,
    title: project.project_name,
    description: project.description || "",
    subtitle: project.description || "",

    status: project.status || "",
    project_type: project.project_type || "",

    start_date: toISODateOnly(project.start_date),
    end_date: toISODateOnly(project.end_date),

    startDate: toISODateOnly(project.start_date),
    endDate: toISODateOnly(project.end_date),

    managerId: managerUser?.id || null,
    managerName: userFullName(managerUser) || null,
    managerEmail: managerUser?.email || null,
  };
};

// Get project dashboard. Return all projects with stats
exports.getProjectsDashboard = async (req, res) => {
  try {
    // Get all projects from DB
    const projects = await Project.findAll({
      order: [["id", "DESC"]],
    });

    // Count total projects
    const total = projects.length;
    // Count projects by status
    const stats = projects.reduce(
      (acc, p) => {
        const s = (p.status || "active").toLowerCase();
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      { total }
    );

    // Current Date & Time for task deadlines
    const now = new Date();
    // Count total tasks
    const totalTasks = await Task.count();
    // Count completed tasks
    const completedTasks = await Task.count({
      where: { status: "done" },
    });
    // Count assigned tasks (not completed)
    const assignedTasks = await Task.count({
      where: { status: { [Op.ne]: "done" } },
    });
    // Count overdue tasks (not completed and deadline passed)
    const overdueTasks = await Task.count({
      where: {
        status: { [Op.ne]: "done" },
        deadline: { [Op.lt]: now },
      },
    });

    // Add task stats into stats object
    stats.totalProjects = total;
    stats.totalTasks = totalTasks;
    stats.assignedTasks = assignedTasks;
    stats.completedTasks = completedTasks;
    stats.overdueTasks = overdueTasks;

    // Convert all projects into frontend format
    const mapped = [];
    for (const p of projects) {
      mapped.push(await mapProjectForDashboard(p));
    }

    // Return success response with projects and stats
    return res.status(200).json({
      success: true,
      stats,
      projects: mapped,
    });
  } catch (error) {
    console.error("getProjectsDashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load projects dashboard",
      error: error.message,
    });
  }
};

// GET SINGLE PROJECT BY ID
exports.getProjectById = async (req, res) => {
  try {
    // Get project ID from request params
    const id = Number(req.params.id);
    // Find project by ID
    const project = await Project.findByPk(id);
    // If project not found, return 404 error
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Get all project allocations with user details
    const allocations = await ProjectAllocation.findAll({
      where: { project_id: id },
      include: [
        {
          model: User,
          attributes: ["id", "emp_id", "first_name", "last_name", "email"],
        },
      ],
      order: [["id", "ASC"]],
    });
    // Get all project tasks with details
    const rawTasks = await Task.findAll({
      where: { project_id: id },
      order: [
        ["assigned_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    // Add task_No for each task
    const tasks = rawTasks.map((t, idx) => ({
      ...mapTaskForFrontend(t),
      task_no: idx + 1,
    }));

    // Find project manager from project details
    const managerUser = await pickManagerFromProject(
      project.id,
      project.pm_user_id
    );
    // Return success response with project details, allocations, and tasks
    return res.status(200).json({
      success: true,
      project: {
        id: project.id,
        project_name: project.project_name,
        description: project.description || "",
        status: project.status || "",
        project_type: project.project_type || "",
        start_date: toISODateOnly(project.start_date),
        end_date: toISODateOnly(project.end_date),

        managerId: managerUser?.id || null,
        managerName: userFullName(managerUser) || null,
        managerEmail: managerUser?.email || null,
      },
      allocations,
      tasks,
    });
  } catch (error) {
    console.error("getProjectById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load project",
      error: error.message,
    });
  }
};

// ✅ CREATE PROJECT
exports.createProject = async (req, res) => {
  try {
    const body = req.body || {};
    // Validate project name
    if (!body.name || !String(body.name).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "name is required" });
    }
    // Create project record
    const project = await Project.create({
      project_name: String(body.name).trim(),
      description: body.description || null,
      project_type: body.project_type || "internal",
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      status: body.status || "planning",
      pm_user_id: body.managerId || null,
    });
    // Send success response
    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("createProject error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create project",
      error: error.message,
    });
  }
};

// ✅ UPDATE PROJECT
exports.updateProject = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};

    const project = await Project.findByPk(id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    // Update only provided fields
    await project.update({
      // Update project name if provided
      project_name:
        body.name !== undefined
          ? String(body.name).trim()
          : project.project_name,
      description:
        body.description !== undefined ? body.description : project.description,
      project_type:
        body.project_type !== undefined
          ? body.project_type
          : project.project_type,
      start_date:
        body.start_date !== undefined ? body.start_date : project.start_date,
      end_date: body.end_date !== undefined ? body.end_date : project.end_date,
      status: body.status !== undefined ? body.status : project.status,
      pm_user_id:
        body.managerId !== undefined ? body.managerId : project.pm_user_id,
    });

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("updateProject error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project",
      error: error.message,
    });
  }
};

// ✅ DELETE PROJECT
exports.deleteProject = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const project = await Project.findByPk(id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    await project.destroy();

    return res
      .status(200)
      .json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("deleteProject error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
      error: error.message,
    });
  }
};

// ✅ Replace allocations endpoint (FIXED: profile_pic removed + safe transaction)
exports.replaceProjectAllocations = async (req, res) => {
  const projectId = Number(req.params.id);
  const userIdsRaw = Array.isArray(req.body?.user_ids) ? req.body.user_ids : [];

  if (!projectId || Number.isNaN(projectId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid project id" });
  }

  const userIds = [
    ...new Set(
      userIdsRaw.map((x) => Number(x)).filter((n) => n && !Number.isNaN(n))
    ),
  ];

  const t = await db.sequelize.transaction();
  let committed = false;

  try {
    const project = await db.Project.findByPk(projectId);
    if (!project) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    await db.ProjectAllocation.destroy({
      where: { project_id: projectId },
      transaction: t,
    });

    if (userIds.length) {
      await db.ProjectAllocation.bulkCreate(
        userIds.map((uid) => ({
          project_id: projectId,
          user_id: uid,
        })),
        { transaction: t }
      );
    }

    // ✅ FIX: removed "profile_pic" from attributes
    const allocations = await db.ProjectAllocation.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: db.User,
          attributes: ["id", "emp_id", "first_name", "last_name", "email"],
        },
      ],
      transaction: t,
    });

    await t.commit();
    committed = true;

    return res.status(200).json({
      success: true,
      message: "Project members updated successfully",
      allocations,
    });
  } catch (error) {
    if (!committed) {
      try {
        await t.rollback();
      } catch (_) {}
    }

    console.error("replaceProjectAllocations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to replace allocations",
      error: error.message,
    });
  }
};

// Extra exports referenced in routes (keep safe)
exports.getProjectTasks = async (req, res) => {
  try {
    const projectId = Number(req.params.id);

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const rawTasks = await Task.findAll({
      where: { project_id: projectId },
      order: [
        ["assigned_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    return res.status(200).json({
      success: true,
      tasks: rawTasks.map((t, idx) => ({
        ...mapTaskForFrontend(t),
        task_no: idx + 1,
      })),
    });
  } catch (error) {
    console.error("getProjectTasks error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load tasks",
      error: error.message,
    });
  }
};

exports.createTaskForProject = async (req, res) => {
  return res.status(501).json({ success: false, message: "Not implemented" });
};

exports.getProjectAssignees = async (req, res) => {
  return res.status(501).json({ success: false, message: "Not implemented" });
};