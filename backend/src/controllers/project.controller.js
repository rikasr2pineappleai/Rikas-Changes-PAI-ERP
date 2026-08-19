// Import Sequelize operators
const { Op } = require("sequelize");

// Import all database models
const db = require("../models");

// Get needed models from DB
const { Project, ProjectAllocation, User, Task, EmployeeDetail } = db;

const PROJECT_NAME_PATTERN =
  /^[\p{L}\p{M}\p{N} &+.,:'()/_#-]+$/u;

const validateProjectName = (value) => {
  const projectName = String(value || "").trim();
  if (!projectName) return "Project name is required.";
  if (projectName.length > 150) {
    return "Project name cannot exceed 150 characters.";
  }
  if (!PROJECT_NAME_PATTERN.test(projectName)) {
    return "Project name contains unsupported characters.";
  }
  if (!/[\p{L}\p{N}]/u.test(projectName)) {
    return "Project name must contain at least one letter or number.";
  }
  return "";
};

// Base URL for serving uploaded files
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || "http://localhost:5001";

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

const daysFromToday = (date) => {
  if (!date) return null;

  const dueDate = new Date(date);
  if (Number.isNaN(dueDate.getTime())) return null;

  const today = new Date();
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
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
  // Include EmployeeDetail to get the profile image path
  const userInclude = {
    model: User,
    attributes: ["id", "emp_id", "first_name", "last_name", "email"],
    include: [
      {
        model: EmployeeDetail,
        attributes: ["image_path"],
      },
    ],
  };

  // Get all allocations for the project
  const allocations = await ProjectAllocation.findAll({
    where: { project_id: projectId },
    include: [userInclude],
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
      include: [{ model: EmployeeDetail, attributes: ["image_path"] }],
    });
    if (pm) return pm;
  }

  // If no manager found, return the first allocation
  return allocations[0]?.User || null;
};

// Build a full avatar URL from the stored image_path (e.g. "uploads/image-xxx.jpg")
const buildAvatarUrl = (imagePath) => {
  if (!imagePath) return null;
  // Already a full URL
  if (imagePath.startsWith("http")) return imagePath;
  // Relative path like "uploads/image-xxx.jpg"
  return `${SERVER_BASE_URL}/${imagePath.replace(/^\/+/, "")}`;
};

// Convert project DB data to dashboard format
const mapProjectForDashboard = async (project) => {
  // Find project manager from project details
  const managerUser = await pickManagerFromProject(
    project.id,
    project.pm_user_id
  );

  // Per-project task summary used by the All Projects card
  // - taskCount: total number of tasks on this project
  // - completedTaskCount: number of tasks with status === "done"
  // - firstTaskAssignedAt: earliest assigned_at of any task on this project
  const taskCount = await Task.count({ where: { project_id: project.id } });
  const completedTaskCount = await Task.count({
    where: { project_id: project.id, status: "done" },
  });
  const firstTask = taskCount
    ? await Task.findOne({
      where: { project_id: project.id },
      order: [["assigned_at", "ASC"]],
      attributes: ["assigned_at"],
    })
    : null;
  const firstTaskAssignedAt = firstTask
    ? toISODateOnly(firstTask.assigned_at)
    : null;
  const taskDeadlines = await Task.findAll({
    where: {
      project_id: project.id,
      status: { [Op.ne]: "done" },
      deadline: { [Op.ne]: null },
    },
    attributes: ["deadline"],
  });
  const taskDaysLeft = taskDeadlines
    .map((task) => daysFromToday(task.deadline))
    .filter((days) => days !== null);
  const totalTaskDaysLeft = taskDaysLeft.length
    ? taskDaysLeft.reduce((total, days) => total + days, 0)
    : null;

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

    // Task summary fields for the All Projects card
    taskCount,
    completedTaskCount,
    firstTaskAssignedAt,
    allTasksCompleted: taskCount > 0 && completedTaskCount === taskCount,
    totalTaskDaysLeft,

    managerId: managerUser?.id || null,
    managerName: userFullName(managerUser) || null,
    managerEmail: managerUser?.email || null,
    managerAvatar: buildAvatarUrl(managerUser?.EmployeeDetail?.image_path),
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
          attributes: ["id", "emp_id", "first_name", "last_name", "email", "designation"],
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
  // --- Mandatory field validation  ---
  const ALLOWED_PROJECT_TYPES = ['internal', 'client'];
  const ALLOWED_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];

  const body = req.body || {};

  // Helper: check if a string value is present and non-empty
  const isEmptyString = (val) =>
    val === undefined || val === null || String(val).trim() === '';

  // 1. Validate name
  const projectNameError = validateProjectName(body.name);
  if (projectNameError) {
    return res.status(400).json({
      success: false,
      message: projectNameError,
      field: "name",
    });
  }

  // 2. Validate description
  if (isEmptyString(body.description)) {
    return res.status(400).json({
      success: false,
      message: "Description is required",
      field: "description",
    });
  }

  // 3. Validate project_type
  if (isEmptyString(body.project_type)) {
    return res.status(400).json({
      success: false,
      message: "Project type is required",
      field: "project_type",
    });
  }
  if (!ALLOWED_PROJECT_TYPES.includes(String(body.project_type).trim().toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid project type. Allowed values: ${ALLOWED_PROJECT_TYPES.join(', ')}`,
      field: "project_type",
    });
  }

  // 4. Validate status
  if (isEmptyString(body.status)) {
    return res.status(400).json({
      success: false,
      message: "Status is required",
      field: "status",
    });
  }
  if (!ALLOWED_STATUSES.includes(String(body.status).trim().toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      field: "status",
    });
  }

  // 5. Validate start_date
  if (isEmptyString(body.start_date)) {
    return res.status(400).json({
      success: false,
      message: "Start date is required",
      field: "start_date",
    });
  }
  const parsedStartDate = new Date(body.start_date);
  if (isNaN(parsedStartDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid start date format",
      field: "start_date",
    });
  }

  // 6. Validate end_date
  if (isEmptyString(body.end_date)) {
    return res.status(400).json({
      success: false,
      message: "End date is required",
      field: "end_date",
    });
  }
  const parsedEndDate = new Date(body.end_date);
  if (isNaN(parsedEndDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid end date format",
      field: "end_date",
    });
  }

  // 7. Validate managerId
  if (body.managerId === undefined || body.managerId === null || String(body.managerId).trim() === '') {
    return res.status(400).json({
      success: false,
      message: "Manager is required",
      field: "managerId",
    });
  }
  const managerId = Number(body.managerId);
  if (isNaN(managerId) || managerId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid manager ID",
      field: "managerId",
    });
  }

  // --- All validations passed, proceed with DB operations ---
  const t = await db.sequelize.transaction();
  let committed = false;

  try {
    const memberIds = Array.isArray(body.memberIds)
      ? body.memberIds.map((id) => Number(id)).filter((id) => id && !Number.isNaN(id))
      : [];
    const allocationUserIds = [
      ...new Set([managerId, ...memberIds].filter(Boolean)),
    ];

    // Create project record
    const project = await Project.create({
      project_name: String(body.name).trim(),
      description: String(body.description).trim(),
      project_type: String(body.project_type).trim().toLowerCase(),
      start_date: body.start_date,
      end_date: body.end_date,
      status: String(body.status).trim().toLowerCase(),
      pm_user_id: managerId,
    }, { transaction: t });

    if (allocationUserIds.length > 0) {
      await ProjectAllocation.bulkCreate(
        allocationUserIds.map((userId) => ({
          project_id: project.id,
          user_id: userId,
          role_in_project: userId === managerId ? "Project Manager" : "Team Member",
        })),
        { transaction: t }
      );
    }

    await t.commit();
    committed = true;

    const createdProject = await Project.findByPk(project.id, {
      include: [
        {
          model: ProjectAllocation,
          include: [
            {
              model: User,
              attributes: ["id", "emp_id", "first_name", "last_name", "email", "designation"],
            },
          ],
        },
      ],
    });

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: createdProject || project,
    });
  } catch (error) {
    if (!committed) {
      try {
        await t.rollback();
      } catch (_) { }
    }

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

    if (body.name !== undefined) {
      const projectNameError = validateProjectName(body.name);
      if (projectNameError) {
        return res.status(400).json({
          success: false,
          message: projectNameError,
          field: "name",
        });
      }
    }

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
          attributes: ["id", "emp_id", "first_name", "last_name", "email", "designation"],
        },
      ],
      order: [["id", "ASC"]],
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
      } catch (_) { }
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
