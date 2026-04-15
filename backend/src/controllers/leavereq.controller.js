// controllers/leavereq.controller.js
const db = require("../models");
const { Op } = require("sequelize");
const LeaveRequest = db.LeaveRequest;
const LeaveType = db.LeaveType;
const Notification = db.Notification;
const LeaveServices = require('../services/LeaveService');
const fs = require('fs');
const path = require('path');

const VALID_LEAVE_MODES = ['full_day', 'half_day', 'hours_permission', 'compulsory', 'Half Day'];
const VALID_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

function getLeaveUploadDirectories() {
  return [
    path.join(__dirname, "..", "uploads"),
    path.join(__dirname, "..", "..", "uploads"),
  ];
}

function findExistingLeaveDocumentFile(requestId) {
  const normalizedId = String(requestId);

  for (const uploadDir of getLeaveUploadDirectories()) {
    if (!fs.existsSync(uploadDir)) continue;

    const matchedFile = fs
      .readdirSync(uploadDir)
      .find((fileName) => fileName.includes(normalizedId));

    if (matchedFile) {
      return {
        uploadDir,
        fileName: matchedFile,
        filePath: path.join(uploadDir, matchedFile),
      };
    }
  }

  return null;
}

function renameUploadedLeaveDocument(uploadFile, requestId) {
  if (!uploadFile || !uploadFile.path || !requestId) return null;

  const fileExtension = path.extname(uploadFile.originalname || uploadFile.filename);
  const renamedFileName = `leave-request-${requestId}${fileExtension}`;
  const renamedFilePath = path.join(path.dirname(uploadFile.path), renamedFileName);

  if (uploadFile.path !== renamedFilePath && fs.existsSync(uploadFile.path)) {
    fs.renameSync(uploadFile.path, renamedFilePath);
  }

  return {
    fileName: renamedFileName,
    filePath: renamedFilePath,
  };
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const m = timeStr.match(/^([0-9]{1,2}):([0-9]{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return hh * 60 + mm;
}

function parseTimeToDate(timeStr) {
  const today = new Date();
  const [hh, mm, ss = 0] = timeStr.split(":").map(Number);
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    hh,
    mm,
    ss,
  );
}

const isSequelizeValidationError = (err) =>
  err &&
  (err.name === "SequelizeValidationError" ||
    err.name === "SequelizeDatabaseError");

const enforced_leave_type_id = 19; // Temporary business rule for compulsory leave
const enforced_number_of_days = 1; // Temporary business rule for compulsory leave

/**
 * Check if user has sufficient leave balance for the requested leave
 */
async function checkLeaveBalance(
  user_id,
  leave_type_id,
  requested_days,
  currentRequestId = null,
) {
  try {
    // Get the leave type to know the total allocated days
    const leaveType = await db.LeaveType.findByPk(leave_type_id);
    if (!leaveType) {
      throw new Error("Leave type not found");
    }

    const totalAllocated = parseFloat(leaveType.day_count || 0);

    // Get all approved/pending requests for this user and leave type (excluding the current request if updating)
    const existingRequests = await db.LeaveRequest.findAll({
      where: {
        user_id: user_id,
        leave_type_id: leave_type_id,
        ...(currentRequestId ? { id: { [Op.ne]: currentRequestId } } : {}),
        [Op.or]: [{ status: "approved" }, { status: "pending" }],
      },
    });

    // Calculate total days already requested/approved
    let totalUsed = 0;
    for (const request of existingRequests) {
      totalUsed += parseFloat(request.number_of_days || 0);
    }

    // Check if adding the requested days would exceed the total allocated
    const totalAfterRequest = totalUsed + requested_days;

    if (totalAfterRequest > totalAllocated) {
      // Determine leave type name for error message
      let leaveTypeName = "Leave";
      if (leaveType.leave_name) {
        leaveTypeName = leaveType.leave_name;
      } else if (leaveType.leave_type) {
        leaveTypeName = leaveType.leave_type;
      }

      const remainingDays = totalAllocated - totalUsed;
      const remainingStr =
        remainingDays === 1 ? "1 day" : `${remainingDays} days`;
      const requestedStr =
        requested_days === 1 ? "1 day" : `${requested_days} days`;
      const error = new Error(
        `Leave days cannot exceed available balance. You have ${remainingStr} remaining for ${leaveTypeName}, but requested ${requestedStr}.`,
      );
      // Mark as a business / validation error so controllers can return 4xx
      error.status = 400;
      throw error;
    }

    return true; // Balance is sufficient
  } catch (error) {
    throw error;
  }
}

/**
 * CREATE hours permission leave request
 * POST /api/leave-request/hours-permission
 */
exports.createHoursPermissionLeave = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      leave_type_id,
      start_date,
      start_time,
      end_time,
      reason,
      number_of_days,
    } = req.body;

    // Use the authenticated user ID from middleware
    const actual_user_id = req.user ? req.user.id : null;

    // Validate required fields
    const missing = [];
    if (!actual_user_id) missing.push("user_id (from authentication)");
    if (!leave_type_id) missing.push("leave_type_id");
    if (!start_date) missing.push("start_date");
    if (!start_time) missing.push("start_time");
    if (!end_time) missing.push("end_time");
    if (!reason) missing.push("reason");
    if (!number_of_days) missing.push("number_of_days");

    if (missing.length) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    // Validate leave_mode is 'hours_permission'
    const leave_mode = "hours_permission";

    // Validate time format
    if (!TIME_REGEX.test(start_time) || !TIME_REGEX.test(end_time)) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid time format" });
    }

    // Validate that end_time is after start_time
    if (parseTimeToDate(end_time) <= parseTimeToDate(start_time)) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "end_time must be after start_time" });
    }

    // Calculate time difference in minutes
    const startTimeParsed = parseTimeToMinutes(start_time);
    const endTimeParsed = parseTimeToMinutes(end_time);
    const timeDiffMinutes = endTimeParsed - startTimeParsed;

    // Ensure time difference is within 3 hours (180 minutes)
    if (timeDiffMinutes <= 0 || timeDiffMinutes > 180) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "Time range must be within 3 hours" });
    }

    // Parse number_of_days to ensure it's a valid number
    let numDays = parseFloat(number_of_days);
    if (isNaN(numDays)) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid number_of_days" });
    }

    const sDate = new Date(start_date);
    if (Number.isNaN(sDate.getTime())) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid start_date" });
    }

    // validate reason if provided
    let reasonToSave = "";
    if (reason !== undefined && reason !== null) {
      if (typeof reason !== "string") {
        await t.rollback();
        return res.status(400).json({ error: "reason must be a string" });
      }
      if (reason.length > 255) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "reason must be at most 255 characters" });
      }
      reasonToSave = reason;
    }

    const leaveType = await LeaveType.findByPk(leave_type_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!leaveType) {
      await t.rollback();
      return res.status(400).json({ error: "Leave type not found" });
    }

    // Check leave balance before creating the request
    await checkLeaveBalance(actual_user_id, leave_type_id, numDays);

    const created = await LeaveRequest.create(
      {
        user_id: actual_user_id, // user_id from authenticated user
        leave_type_id: leave_type_id,
        leave_mode: leave_mode, // Fixed to 'hours_permission'
        number_of_days: numDays,
        start_date: start_date,
        end_date: null, // Hours permission doesn't have end_date
        start_time: start_time,
        end_time: end_time,
        requested_at: new Date(),
        reason: reasonToSave,
        upload_document: req.file ? true : false, // Set upload_document based on file upload
        document_path: req.file ? req.file.filename : null,
        leave_session: req.body.leave_session || null,
      },
      { transaction: t },
    );

    if (req.file) {
      renameUploadedLeaveDocument(req.file, created.id);
    }

    // Do NOT update LeaveBalance immediately when request is created
    // Only update LeaveBalance when status changes to 'approved'
    // This ensures pie charts show accurate balances based on approved requests only

    await t.commit();
    return res.status(201).json({
      message: "Hours permission leave request created",
      data: created,
    });
  } catch (err) {
    try {
      await t.rollback();
    } catch (_) {}
    console.error("createHoursPermissionLeave error", err);
    if (isSequelizeValidationError(err))
      return res.status(400).json({ error: err.message });
    if (err && err.status)
      return res.status(err.status).json({ error: err.message });
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

/**
 * CREATE leave request
 * POST /api/leave-request
 */
exports.create = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      leave_type_id,
      leave_mode,
      number_of_days,
      start_date,
      end_date,
      start_time,
      end_time,
      reason, // <-- new optional field
    } = req.body;

    // Use the authenticated user ID from middleware
    const actual_user_id = req.user ? req.user.id : null;

    // Validate required fields
    const missing = [];
    if (!actual_user_id) missing.push("user_id (from authentication)");
    if (!leave_type_id) missing.push("leave_type_id");
    if (!leave_mode) missing.push("leave_mode");
    if (!number_of_days) missing.push("number_of_days");
    if (!start_date) missing.push("start_date");
    if (!reason) missing.push("reason"); // Make reason required

    if (missing.length) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    if (!VALID_LEAVE_MODES.includes(leave_mode)) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid leave_mode" });
    }

    // Parse number_of_days to ensure it's a valid number
    let numDays = parseFloat(number_of_days);
    if (isNaN(numDays)) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid number_of_days" });
    }

    // For full day leave requests, ensure number_of_days is valid
    if (leave_mode === "full_day") {
      if (numDays <= 0) {
        await t.rollback();
        return res.status(400).json({
          error: "Full day leave requests must have a positive number of days",
        });
      }
    }

    const sDate = new Date(start_date);
    if (Number.isNaN(sDate.getTime())) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid start_date" });
    }

    if (end_date) {
      const eDate = new Date(end_date);
      if (Number.isNaN(eDate.getTime())) {
        await t.rollback();
        return res.status(400).json({ error: "Invalid end_date" });
      }
      if (eDate < sDate) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "End date must be after start date" });
      }
    }

    if (leave_mode === "hours_permission") {
      if (!start_time || !end_time) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "start_time and end_time required" });
      }
      if (!TIME_REGEX.test(start_time) || !TIME_REGEX.test(end_time)) {
        await t.rollback();
        return res.status(400).json({ error: "Invalid time format" });
      }
      if (parseTimeToDate(end_time) <= parseTimeToDate(start_time)) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "end_time must be after start_time" });
      }
    }

    // validate reason if provided
    let reasonToSave = "";
    if (reason !== undefined && reason !== null) {
      if (typeof reason !== "string") {
        await t.rollback();
        return res.status(400).json({ error: "reason must be a string" });
      }
      if (reason.length > 255) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "reason must be at most 255 characters" });
      }
      reasonToSave = reason;
    }

    const leaveType = await LeaveType.findByPk(leave_type_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!leaveType) {
      await t.rollback();
      return res.status(400).json({ error: "Leave type not found" });
    }

    // Check leave balance before creating the request
    await checkLeaveBalance(actual_user_id, leave_type_id, numDays);

    const created = await LeaveRequest.create(
      {
        user_id: actual_user_id, // user_id from authenticated user
        leave_type_id: leave_type_id,
        leave_mode: leave_mode, // leave_mode from frontend
        number_of_days: numDays,
        start_date: start_date,
        end_date: end_date || null,
        start_time: start_time || null,
        end_time: end_time || null,
        requested_at: new Date(),
        reason: reasonToSave,
        upload_document: req.file ? true : false, // Set upload_document based on file upload
        document_path: req.file ? req.file.filename : null,
        leave_session: req.body.leave_session || null,
      },
      { transaction: t },
    );

    if (req.file) {
      renameUploadedLeaveDocument(req.file, created.id);
    }

    // Do NOT update LeaveBalance immediately when request is created
    // Only update LeaveBalance when status changes to 'approved'
    // This ensures pie charts show accurate balances based on approved requests only

    await t.commit();
    return res
      .status(201)
      .json({ message: "Leave request created", data: created });
  } catch (err) {
    try {
      await t.rollback();
    } catch (_) {}
    console.error("create error", err);
    if (isSequelizeValidationError(err))
      return res.status(400).json({ error: err.message });
    if (err && err.status)
      return res.status(err.status).json({ error: err.message });
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

/**
 * UPDATE STATUS
 *
 * You can also optionally pass `reason` and `approved_by` in the body.
 */
exports.updateStatus = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    console.log("UpdateStatus called with params:", req.params);
    console.log("UpdateStatus called with body:", req.body);
    console.log("User in request:", req.user ? req.user.id : "No user");

    const { id } = req.params;
    const { status: newStatus, approved_by, reason } = req.body;

    // Convert status to lowercase to handle case-insensitive input
    if (!newStatus) {
      await t.rollback();
      return res.status(400).json({ error: "Status is required" });
    }

    const lowerCaseNewStatus = newStatus ? newStatus.toLowerCase() : null;

    if (!VALID_STATUSES.includes(lowerCaseNewStatus)) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid status" });
    }

    // validate reason if present
    let reasonToSave = undefined;
    if (reason !== undefined) {
      if (reason !== null && typeof reason !== "string") {
        await t.rollback();
        return res.status(400).json({ error: "reason must be a string" });
      }
      if (typeof reason === "string" && reason.length > 255) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "reason must be at most 255 characters" });
      }
      reasonToSave = reason === null ? "" : reason;
    }

    // validate adminReason if present
    let adminReasonToSave = undefined;
    if (req.body.adminReason !== undefined) {
      const adminReason = req.body.adminReason;
      if (adminReason !== null && typeof adminReason !== "string") {
        await t.rollback();
        return res.status(400).json({ error: "adminReason must be a string" });
      }
      if (typeof adminReason === "string" && adminReason.length > 255) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "adminReason must be at most 255 characters" });
      }
      adminReasonToSave = adminReason === null ? null : adminReason;
    }

    const leaveReq = await LeaveRequest.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!leaveReq) {
      await t.rollback();
      return res.status(404).json({ error: "Leave request not found" });
    }

    const prevStatus = leaveReq.status;

    // ===== APPROVE =====
    if (lowerCaseNewStatus === "approved") {
      // When approving, we need to add to LeaveBalance since it wasn't added when created
      await LeaveServices.addToLeaveBalance(leaveReq, { transaction: t });

      await leaveReq.update(
        {
          status: lowerCaseNewStatus,
          approved_by: approved_by || null,
          ...(reasonToSave !== undefined ? { reason: reasonToSave } : {}),
          ...(adminReasonToSave !== undefined
            ? { adminReason: adminReasonToSave }
            : {}),
        },
        { transaction: t },
      );

      // Create notification
      await Notification.create({
        user_id: leaveReq.user_id,
        title: "Leave Approved",
        message: `Your leave request from ${leaveReq.start_date} has been approved.`,
        type: "success",
      }, { transaction: t });
    }

    // ===== REJECT / CANCEL =====
    else if (
      lowerCaseNewStatus === "rejected" ||
      lowerCaseNewStatus === "cancelled"
    ) {
      // When rejecting/cancelling, we need to remove from LeaveBalance if it was previously approved
      if (prevStatus === "approved") {
        await LeaveServices.removeFromLeaveBalance(leaveReq, {
          transaction: t,
        });
      }

      // restore day_count (we assume creation deducted it)
      // lock leaveType row to update
      const leaveType = await LeaveType.findByPk(leaveReq.leave_type_id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (leaveType) {
        const deducted = Math.max(
          0,
          Math.round(parseFloat(leaveReq.number_of_days || 0)),
        );
        await leaveType.update(
          { day_count: leaveType.day_count + deducted },
          { transaction: t },
        );
      }

      await leaveReq.update(
        {
          status: lowerCaseNewStatus,
          approved_by: approved_by || null,
          ...(reasonToSave !== undefined ? { reason: reasonToSave } : {}),
          ...(adminReasonToSave !== undefined
            ? { adminReason: adminReasonToSave }
            : {}),
        },
        { transaction: t },
      );

      // Create notification
      await Notification.create({
        user_id: leaveReq.user_id,
        title: lowerCaseNewStatus === 'rejected' ? "Leave Rejected" : "Leave Cancelled",
        message: `Your leave request from ${leaveReq.start_date} has been ${lowerCaseNewStatus}.`,
        type: lowerCaseNewStatus === 'rejected' ? "error" : "warning",
      }, { transaction: t });
    }

    // ===== BACK TO PENDING =====
    else if (lowerCaseNewStatus === "pending") {
      // When reverting to pending, we need to remove from LeaveBalance if it was previously approved
      if (prevStatus === "approved") {
        await LeaveServices.removeFromLeaveBalance(leaveReq, {
          transaction: t,
        });
      }

      // reset approved_by and keep day_count logic similar to cancelled/rejected:
      const leaveType = await LeaveType.findByPk(leaveReq.leave_type_id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (leaveType) {
        // only restore if previously deducted at creation (we assume create deducted)
        const deducted = Math.max(
          0,
          Math.round(parseFloat(leaveReq.number_of_days || 0)),
        );
        await leaveType.update(
          { day_count: leaveType.day_count + deducted },
          { transaction: t },
        );
      }

      await leaveReq.update(
        {
          status: lowerCaseNewStatus,
          approved_by: null,
          ...(reasonToSave !== undefined ? { reason: reasonToSave } : {}),
          ...(adminReasonToSave !== undefined
            ? { adminReason: adminReasonToSave }
            : {}),
        },
        { transaction: t },
      );
    }

    await t.commit();
    return res.json({ message: "Status updated successfully" });
  } catch (err) {
    try {
      await t.rollback();
    } catch (_) {}
    console.error("updateStatus error", err);
    if (isSequelizeValidationError(err))
      return res.status(400).json({ error: err.message });
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

/**
 * PUT /api/leave-request/:id/admin-reason
 *
 * Add or update adminReason (the new column). Accepts:
 *   { adminReason: "some text" } or { adminReason: null } to clear
 */
exports.updateAdminReason = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { adminReason } = req.body;

    // Validate adminReason if present (allow null to clear)
    if (
      adminReason !== undefined &&
      adminReason !== null &&
      typeof adminReason !== "string"
    ) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "adminReason must be a string or null" });
    }
    if (typeof adminReason === "string" && adminReason.length > 255) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "adminReason must be at most 255 characters" });
    }

    const leaveReq = await LeaveRequest.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!leaveReq) {
      await t.rollback();
      return res.status(404).json({ error: "Leave request not found" });
    }

    await leaveReq.update(
      { adminReason: adminReason === null ? null : adminReason },
      { transaction: t },
    );

    await t.commit();
    return res.json({ message: "Admin reason updated successfully", id });
  } catch (err) {
    try {
      await t.rollback();
    } catch (_) {}
    console.error("updateAdminReason error", err);
    if (isSequelizeValidationError(err))
      return res.status(400).json({ error: err.message });
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

/**
 * GET ALL
 * GET /api/leave-request
 * query: user_id, status, leave_type_id, limit, offset
 */
exports.getAll = async (req, res) => {
  try {
    const { user_id, status, leave_type_id } = req.query;
    let limit = parseInt(req.query.limit, 10) || 100;
    let offset = parseInt(req.query.offset, 10) || 0;
    if (limit < 1) limit = 1;
    if (limit > 1000) limit = 1000;
    if (offset < 0) offset = 0;

    const where = {};
    if (user_id) where.user_id = user_id;
    if (status) {
      if (!VALID_STATUSES.includes(status))
        return res.status(400).json({ error: "Invalid status filter" });
      where.status = status;
    }
    if (leave_type_id) where.leave_type_id = leave_type_id;

    const include = [];
    if (db.LeaveType) {
      include.push({
        model: db.LeaveType,
        required: false, // Make the association optional so records with invalid leave_type_id still load
      });
    }
    if (db.User) {
      include.push({
        model: db.User,
        required: false, // Make user association optional to prevent filtering out records
        include: [
          {
            model: db.EmployeeDetail,
            required: false, // Make the association optional so missing EmployeeDetail doesn't filter out records
          },
        ],
      });
    }
    if (
      db.User &&
      LeaveRequest.associations &&
      LeaveRequest.associations.ApprovedBy
    ) {
      include.push({
        model: db.User,
        as: "ApprovedBy",
        required: false, // Make ApprovedBy association optional
      });
    }

    const result = await LeaveRequest.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [["requested_at", "DESC"]],
      attributes: {
        include: [
          "adminReason",
          "start_date",
          "end_date",
          "start_time",
          "end_time",
          "upload_document",
        ],
      }, // Include all necessary fields in the response
    });

    return res.json({ count: result.count, rows: result.rows, limit, offset });
  } catch (err) {
    console.error("getAll error", err);
    if (isSequelizeValidationError(err))
      return res.status(400).json({ error: err.message });
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

/**
 * GET BY ID
 * GET /api/leave-request/:id
 */
exports.getById = async (req, res) => {
  try {
    const id = req.params.id;
    const include = [];
    if (db.LeaveType) {
      include.push({
        model: db.LeaveType,
        required: false, // Make the association optional so records with invalid leave_type_id still load
      });
    }
    if (db.User) {
      include.push({
        model: db.User,
        required: false, // Make user association optional to prevent filtering out records
        include: [
          {
            model: db.EmployeeDetail,
            required: false, // Make the association optional so missing EmployeeDetail doesn't filter out records
          },
        ],
      });
    }
    if (
      db.User &&
      LeaveRequest.associations &&
      LeaveRequest.associations.ApprovedBy
    ) {
      include.push({
        model: db.User,
        as: "ApprovedBy",
        required: false, // Make ApprovedBy association optional
      });
    }

    const rec = await LeaveRequest.findByPk(id, {
      include,
      attributes: {
        include: [
          "adminReason",
          "start_date",
          "end_date",
          "start_time",
          "end_time",
          "upload_document",
        ],
      }, // Include all necessary fields in the response
    });
    if (!rec) return res.status(404).json({ error: "Leave request not found" });
    return res.json(rec);
  } catch (err) {
    console.error("getById error", err);
    if (isSequelizeValidationError(err))
      return res.status(400).json({ error: err.message });
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

/**
 * DELETE
 * DELETE /api/leave-request/:id
 */
exports.delete = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const id = req.params.id;
    const leaveReq = await LeaveRequest.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!leaveReq) {
      await t.rollback();
      return res.status(404).json({ error: "Leave request not found" });
    }

    // Only remove from leave_balance if the request was approved (since only approved requests affect LeaveBalance now)
    if (leaveReq.status === "approved") {
      await LeaveServices.removeFromLeaveBalance(leaveReq, { transaction: t });
    }

    // restore the leaveType.day_count if creation had deducted it (we assume it did)
    const leaveType = await LeaveType.findByPk(leaveReq.leave_type_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (leaveType) {
      const deducted = Math.max(
        0,
        Math.round(parseFloat(leaveReq.number_of_days || 0)),
      );
      await leaveType.update(
        { day_count: leaveType.day_count + deducted },
        { transaction: t },
      );
    }

    await leaveReq.destroy({ transaction: t });
    await t.commit();
    return res.json({ message: "Leave request deleted", id });
  } catch (err) {
    try {
      await t.rollback();
    } catch (_) {}
    console.error("delete error", err);
    if (isSequelizeValidationError(err))
      return res.status(400).json({ error: err.message });
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

/**
 * CREATE half day leave request
 * POST /api/leave-request/halfday
 */
exports.createHalfdayLeave = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    // When using multipart form data, values come as strings, so we need to handle type conversion
    const { leave_type_id, leave_mode, start_date, leave_session, reason } =
      req.body;

    // Convert values that might be strings from form data
    const typedLeaveTypeId =
      typeof leave_type_id === "string"
        ? parseInt(leave_type_id, 10)
        : leave_type_id;
    const typedStartDate = start_date;
    const typedLeaveMode = leave_mode;
    const typedLeaveSession = leave_session;
    const typedReason = reason;

    // Use the authenticated user ID if available, otherwise fallback to req.body.user_id
    const actual_user_id = req.user ? req.user.id : req.body.user_id;

    // Validate required fields
    const missing = [];
    if (!actual_user_id) missing.push("user_id");

    // Check if leave_type_id is valid (not NaN, null, undefined, or <= 0)
    if (
      typedLeaveTypeId === null ||
      typedLeaveTypeId === undefined ||
      isNaN(typedLeaveTypeId) ||
      typedLeaveTypeId <= 0
    ) {
      missing.push("leave_type_id");
    }

    if (!typedLeaveMode) missing.push("leave_mode");
    if (!typedStartDate) missing.push("start_date");
    if (!typedLeaveSession) missing.push("leave_session");

    if (missing.length) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    // Ensure leave_mode is 'Half Day' or 'half_day' for this endpoint
    if (leave_mode !== "Half Day" && leave_mode !== "half_day") {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "Invalid leave_mode for half day request" });
    }

    // Normalize the leave_mode to the expected ENUM value for storage
    const normalizedLeaveMode = "half_day";

    const sDate = new Date(start_date);
    if (Number.isNaN(sDate.getTime())) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid start_date" });
    }

    // validate reason if provided
    let reasonToSave = "";
    if (reason !== undefined && reason !== null) {
      if (typeof reason !== "string") {
        await t.rollback();
        return res.status(400).json({ error: "reason must be a string" });
      }
      if (reason.length > 255) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "reason must be at most 255 characters" });
      }
      reasonToSave = reason;
    }

    const leaveType = await LeaveType.findByPk(typedLeaveTypeId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!leaveType) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: `Leave type with ID ${typedLeaveTypeId} not found` });
    }

    const numDays = 0.5; // Half day is always 0.5 days

    // Check leave balance before creating the request
    await checkLeaveBalance(actual_user_id, typedLeaveTypeId, numDays);

    const created = await LeaveRequest.create(
      {
        user_id: actual_user_id,
        leave_type_id: typedLeaveTypeId,
        leave_mode: normalizedLeaveMode, // Use normalized ENUM value
        number_of_days: numDays,
        start_date,
        end_date: null, // Half day requests don't have end_date
        start_time: null,
        end_time: null,
        requested_at: new Date(),
        reason: reasonToSave,
        upload_document: req.file ? true : false,
        document_path: req.file ? req.file.filename : null,
        leave_session,
      },
      { transaction: t },
    );

    if (req.file) {
      renameUploadedLeaveDocument(req.file, created.id);
    }

    // Do NOT update LeaveBalance immediately when request is created
    // Only update LeaveBalance when status changes to 'approved'
    // This ensures pie charts show accurate balances based on approved requests only

    await t.commit();
    return res.status(201).json({
      success: true,
      message: "Half day leave request created",
      data: created,
    });
  } catch (err) {
    try {
      await t.rollback();
    } catch (_) {}
    console.error("createHalfdayLeave error", err);
    // Prefer returning a descriptive 400 for known business / validation issues,
    // and only use 500 for truly unexpected failures.
    if (isSequelizeValidationError(err)) {
      return res.status(400).json({ error: err.message });
    }
    if (err && typeof err.message === "string") {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * CREATE compulsory leave request
 * POST /api/leave-request/compulsory
 */
exports.createCompulsoryLeave = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { leave_mode, start_date, reason } = req.body;

    // Use the authenticated user ID if available, otherwise fallback to req.body.user_id
    const actual_user_id = req.user ? req.user.id : req.body.user_id;

    // Validate required fields
    const missing = [];
    if (!actual_user_id) missing.push("user_id");
    if (!leave_mode) missing.push("leave_mode");
    if (!start_date) missing.push("start_date");
    if (!reason) missing.push("reason");

    if (missing.length) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    if (!VALID_LEAVE_MODES.includes(leave_mode)) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid leave_mode" });
    }

    const sDate = new Date(start_date);
    if (Number.isNaN(sDate.getTime())) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid start_date" });
    }

    // validate reason
    if (typeof reason !== "string") {
      await t.rollback();
      return res.status(400).json({ error: "reason must be a string" });
    }
    if (reason.length > 255) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: "reason must be at most 255 characters" });
    }

    const leaveType = await LeaveType.findByPk(enforced_leave_type_id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!leaveType) {
      await t.rollback();
      return res.status(400).json({ error: "Leave type not found" });
    }

    const deductDays = Math.round(enforced_number_of_days);
    if (leaveType.day_count < deductDays) {
      await t.rollback();
      return res.status(400).json({ error: "Insufficient leave balance" });
    }

    const created = await LeaveRequest.create(
      {
        user_id: actual_user_id,
        leave_type_id: enforced_leave_type_id,
        leave_mode,
        number_of_days: enforced_number_of_days,
        start_date,
        end_date: null, // Set end_date to null as per requirement
        start_time: null,
        end_time: null,
        requested_at: new Date(),
        reason,
      },
      { transaction: t },
    );

    // Do NOT update LeaveBalance immediately when request is created
    // Only update LeaveBalance when status changes to 'approved'
    // This ensures pie charts show accurate balances based on approved requests only

    await t.commit();
    return res.status(201).json({
      success: true,
      message: "Compulsory leave request created",
      data: created,
    });
  } catch (err) {
    try {
      await t.rollback();
    } catch (_) {}
    console.error("createCompulsoryLeave error", err);
    if (isSequelizeValidationError(err))
      return res.status(400).json({ error: err.message });
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

/**
 * GET /api/leave-request/user/:userId
 * Get leave requests for a specific user (user can get their own, admin can get any)
 */
exports.getByUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const currentUserId = req.user ? req.user.id : null;

    // Check authorization: user can only access their own data, admin can access any
    // Check if user is admin by looking at their roles
    let isAdmin = false;
    if (req.user && req.user.Roles && req.user.Roles.length > 0) {
      isAdmin = req.user.Roles.some((role) => role.role_name === "admin");
    } else if (req.user && req.user.roles && req.user.roles.length > 0) {
      isAdmin = req.user.roles.some((role) => role.role_name === "admin");
    }

    if (!isAdmin && currentUserId !== userId) {
      return res.status(403).json({
        error: "Access denied. You can only access your own leave requests.",
      });
    }

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const include = [];
    if (db.LeaveType) include.push({ model: db.LeaveType });
    if (db.User) include.push({ model: db.User });

    const result = await LeaveRequest.findAndCountAll({
      where: { user_id: userId },
      include,
      order: [["start_date", "ASC"]],
      attributes: {
        include: [
          "adminReason",
          "start_date",
          "end_date",
          "start_time",
          "end_time",
          "upload_document",
        ],
      }, // Include all necessary fields in the response
    });

    res.json({ count: result.count, rows: result.rows });
  } catch (err) {
    console.error("Error fetching leave requests by user:", err);
    if (isSequelizeValidationError(err))
      return res.status(400).json({ error: err.message });
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

/**
 * GET /api/leave-request/:id/document
 * View uploaded proof document
 */
exports.getLeaveDocument = async (req, res) => {
  try {
    const id = req.params.id;
    const leaveReq = await LeaveRequest.findByPk(id);

    if (!leaveReq) {
      return res.status(404).json({
        error: "Leave request not found",
      });
    }

    // employee upload பண்ணியிருக்கா check
    if (!leaveReq.upload_document) {
      return res.status(200).json({
        success: false,
        message: "Proof document not found",
      });
    }

    const documentRecord = findExistingLeaveDocumentFile(id);

    if (!documentRecord) {
      return res.status(200).json({
        success: false,
        message: "Proof document not found",
      });
    }
    const ext = path.extname(documentRecord.fileName).toLowerCase();

    let contentType = "application/octet-stream";

    if (ext === ".pdf") contentType = "application/pdf";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    if (ext === ".png") contentType = "image/png";

    res.setHeader("Content-Type", contentType);

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${documentRecord.fileName}"`,
    );

    fs.createReadStream(documentRecord.filePath).pipe(res);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "server error",
    });
  }
};

/**
 * GET /api/leave-request/user/:userId/calendar
 * Get leave requests formatted for calendar display
 */
exports.getUserCalendarData = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const currentUserId = req.user ? req.user.id : null;

    console.log(
      "getUserCalendarData - userId:",
      userId,
      "currentUserId:",
      currentUserId,
      "req.user exists:",
      !!req.user,
    );

    // Check authorization: user can only access their own data, admin can access any
    // Check if user is admin by looking at their roles
    let isAdmin = false;
    if (req.user && req.user.Roles && req.user.Roles.length > 0) {
      isAdmin = req.user.Roles.some((role) => role.role_name === "admin");
      console.log("isAdmin check via Roles:", isAdmin);
    } else if (req.user && req.user.roles && req.user.roles.length > 0) {
      isAdmin = req.user.roles.some((role) => role.role_name === "admin");
      console.log("isAdmin check via roles:", isAdmin);
    } else {
      console.log("No roles found for user, isAdmin:", isAdmin);
    }

    if (!isAdmin && currentUserId !== userId) {
      console.log("Access denied - not admin and not own user");
      return res.status(403).json({
        error:
          "Access denied. You can only access your own leave calendar data.",
      });
    }

    if (isNaN(userId)) {
      console.log("Invalid user ID provided:", req.params.userId);
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const include = [];
    if (LeaveType) include.push({ model: LeaveType });
    if (db.User) include.push({ model: db.User });

    console.log("Querying leave requests for user_id:", userId);

    const result = await LeaveRequest.findAll({
      where: { user_id: userId },
      include,
      order: [["start_date", "ASC"]],
      attributes: {
        include: [
          "adminReason",
          "start_date",
          "end_date",
          "start_time",
          "end_time",
          "upload_document",
        ],
      }, // Include all necessary fields in the response
    });

    console.log("Found", result.length, "leave requests for user:", userId);

    // Format data for calendar - convert to date-based object
    const calendarData = {};

    for (const request of result) {
      // Handle both single day and multi-day requests
      const startDate = new Date(request.start_date);
      const endDate = request.end_date ? new Date(request.end_date) : startDate;

      // Validate dates before processing
      if (isNaN(startDate.getTime())) {
        console.error(
          `Invalid start date for leave request ${request.id}:`,
          request.start_date,
        );
        continue; // Skip this request if start date is invalid
      }

      if (request.end_date && isNaN(endDate.getTime())) {
        console.error(
          `Invalid end date for leave request ${request.id}:`,
          request.end_date,
        );
        continue; // Skip this request if end date is invalid
      }

      // Add all dates in the range to the calendar
      // Use the original date strings to avoid timezone conversion issues
      // The date strings from the database should be in YYYY-MM-DD format
      const start = new Date(startDate);
      const end = request.end_date
        ? new Date(request.end_date)
        : new Date(startDate);

      if (request.end_date) {
        // Handle multi-day requests
        // Use the original date values without timezone conversion
        let current = new Date(start);
        current.setHours(0, 0, 0, 0); // Set time to start of day to avoid timezone issues

        const endDateObj = new Date(end);
        endDateObj.setHours(0, 0, 0, 0); // Set time to start of day to avoid timezone issues

        while (current <= endDateObj) {
          // Format date as YYYY-MM-DD to match the format expected by frontend
          const year = current.getFullYear();
          const month = String(current.getMonth() + 1).padStart(2, "0");
          const day = String(current.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;

          calendarData[dateStr] = request.status.toLowerCase(); // approved, pending, rejected

          // Move to next day by adding 24 hours to avoid timezone issues
          current.setDate(current.getDate() + 1);
        }
      } else {
        // Handle single day requests
        // Format date as YYYY-MM-DD to match the format expected by frontend
        const year = start.getFullYear();
        const month = String(start.getMonth() + 1).padStart(2, "0");
        const day = String(start.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        calendarData[dateStr] = request.status.toLowerCase(); // approved, pending, rejected
      }
    }

    res.json({ calendarData, leaveRequests: result });
  } catch (err) {
    console.error("Error fetching user calendar data:", err);
    // Only return 400 for actual validation errors, not database errors
    if (err && err.name === "SequelizeValidationError") {
      console.error("Sequelize validation error:", err.message);
      return res
        .status(400)
        .json({ error: "Validation error: " + err.message });
    }
    // For other errors, return 500 to avoid exposing internal details via 400
    console.error("Internal server error details:", err.message);
    return res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};