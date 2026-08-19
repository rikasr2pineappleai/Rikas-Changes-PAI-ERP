const path = require('path');
const {
  User,
  EmployeeDetail,
  EmployeeHistory,
  PromotionHistory,
  Document,
  Department,
  ProjectAllocation,
  Project,
  Notification,
  sequelize,
} = require("../models");
const { upload } = require("../utils/fileUpload");
const {
  personalInfoSchema,
  updatePersonalInfoSchema,
  educationSchema,
  professionalSchema,
  workInfoSchema,
  documentSchema,
  updateDocumentsSchema
} = require("../validators/employee.validation");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

const normalizeOptionalId = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

const normalizeManagementRoleValue = (value) =>
  String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

const getDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const getTodayDateOnly = () => new Date().toISOString().slice(0, 10);

const recordPromotionHistory = async ({
  userId,
  previousManagementRole,
  managementRole,
  designation,
  effectiveDate,
  joinedDate,
}) => {
  try {
    const nextRole = String(managementRole || "").trim();
    if (!nextRole || !PromotionHistory) return;

    const previousRole = String(previousManagementRole || "").trim();
    const normalizedPrevious = normalizeManagementRoleValue(previousRole);
    const normalizedNext = normalizeManagementRoleValue(nextRole);
    const roleChanged = normalizedPrevious !== normalizedNext;

    const existingHistoryCount = await PromotionHistory.count({
      where: { user_id: userId },
    });

    if (!roleChanged && existingHistoryCount > 0) {
      const correctedEffectiveDate = getDateOnly(effectiveDate);
      if (!correctedEffectiveDate) return;

      const existingEntries = await PromotionHistory.findAll({
        where: { user_id: userId },
        order: [["effective_date", "DESC"], ["id", "DESC"]],
      });
      const currentRoleEntry = existingEntries.find(
        (entry) => normalizeManagementRoleValue(entry.management_role) === normalizedNext
      );

      if (currentRoleEntry) {
        await currentRoleEntry.update({
          effective_date: correctedEffectiveDate,
          designation: designation || currentRoleEntry.designation,
        });
        return;
      }
    }

    const resolvedEffectiveDate =
      getDateOnly(effectiveDate) ||
      (!previousRole && existingHistoryCount === 0
        ? getDateOnly(joinedDate)
        : null) ||
      getTodayDateOnly();

    const duplicateEntry = await PromotionHistory.findOne({
      where: {
        user_id: userId,
        management_role: nextRole,
        effective_date: resolvedEffectiveDate,
      },
    });

    if (duplicateEntry) return;

    await PromotionHistory.create({
      user_id: userId,
      previous_management_role: previousRole || null,
      management_role: nextRole,
      designation: designation || null,
      effective_date: resolvedEffectiveDate,
    });
  } catch (error) {
    console.warn("Promotion history skipped:", error.message);
  }
};

// Utility function to handle errors
const handleControllerError = (error, operation) => {
  console.error(`${operation} error:`, error);
  return {
    success: false,
    message: `Server error during ${operation}`,
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  };
};

// Helper function to generate the next unique sequential Employee ID with "PAI" prefix
const generateNextEmployeeId = async (transaction = null) => {
  const users = await User.findAll({
    attributes: ["emp_id"],
    where: {
      emp_id: {
        [Op.like]: "PAI%",
      },
    },
    transaction,
  });

  let maxNum = 0;
  const maxEmployeeIdNumber = 1500;
  const paiRegex = /^PAI(\d{3,4})$/;

  users.forEach((user) => {
    if (user.emp_id) {
      const match = user.emp_id.match(paiRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
  });

  let nextNum = maxNum + 1;
  let candidateId = `PAI${String(nextNum).padStart(3, "0")}`;

  while (nextNum <= maxEmployeeIdNumber) {
    const existing = await User.findOne({
      where: { emp_id: candidateId },
      transaction,
    });
    if (!existing) {
      return candidateId;
    }
    nextNum++;
    candidateId = `PAI${String(nextNum).padStart(3, "0")}`;
  }

  throw new Error("Maximum employee ID limit reached (PAI1500). Cannot generate new IDs.");
};

// @desc    Create employee - Step 1: Personal Information & Credentials
// @route   POST /api/employees/personal
// @access  Private (Admin)
exports.createEmployeePersonal = async (req, res) => {
  try {
    // Validate input
    const { error } = personalInfoSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const {
      first_name,
      last_name,
      email,
      emp_id,
      gender,
      dob,
      phone,
      address,
      password,
    } = req.body;

    let finalEmpId = emp_id && String(emp_id).trim() ? String(emp_id).trim() : null;

    // Check if email already exists
    const existingEmail = await User.findOne({
      where: { email: email.trim() },
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email or employee ID already exists",
      });
    }

    if (finalEmpId) {
      const existingEmpId = await User.findOne({
        where: { emp_id: finalEmpId },
      });

      if (existingEmpId) {
        return res.status(400).json({
          success: false,
          message: "Employee with this email or employee ID already exists",
        });
      }
    } else {
      finalEmpId = await generateNextEmployeeId();
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      first_name: first_name.trim(),
      last_name: last_name ? last_name.trim() : null,
      email: email.trim(),
      emp_id: finalEmpId,
      password_hash,
      role: "employee",
      status: "active",
    });

    // Create employee detail
    await EmployeeDetail.create({
      user_id: user.id,
      gender: gender || null,
      dob: dob || null,
      phone: phone || null,
      address: address || null,
      image_path: null, // Will be updated when image is uploaded
    });

    // Create welcome notification
    await Notification.create({
      user_id: user.id,
      title: "Welcome to Pineapple AI",
      message: `Welcome to Pineapple AI, ${user.first_name}! Your account has been created successfully.`,
      type: "info",
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        user_id: user.id,
        employee_id: user.emp_id,
        emp_id: user.emp_id,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(
      error,
      "create employee personal info"
    );
    res.status(500).json(errorResponse);
  }
};

// @desc    Update employee - Step 1: Personal Information & Credentials
// @route   PUT /api/employees/:id/personal
// @access  Private (Admin)
exports.updateEmployeePersonal = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate only essential fields for updates
    console.log("Received request body:", JSON.stringify(req.body, null, 2));
    console.log("User ID:", userId);

    // Validate input using the updatePersonalInfoSchema
    const { error } = updatePersonalInfoSchema.validate(req.body);
    if (error) {
      console.log("Validation error:", error.details[0].message);
      console.log("Full error details:", JSON.stringify(error.details, null, 2));
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }
    console.log("Validation passed, proceeding with update");

    // Extract only the fields we need to update
    const {
      first_name,
      last_name,
      email,
      emp_id,
      gender,
      dob,
      phone,
      address,
      designation,
      management_role,
      promotion_effective_date,
    role,
      department_id,
      joined_date,
      end_date,
      password,
    } = req.body;
    // Normalize status to lowercase to match ENUM values in database
    const status = req.body.status ? req.body.status.toLowerCase() : undefined;
    // Normalize gender to lowercase to match employee_detail ENUM ('male', 'female', 'other')
    const normalizedGender = gender ? String(gender).toLowerCase() : null;

  // Validate role value against allowed enum if provided
  if (role && !["admin", "employee"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role value. Allowed values are 'admin' or 'employee'.",
    });
  }

    console.log("Extracted fields for update:", {
      first_name,
      last_name,
      email,
      emp_id,
      status,
    });

    // Get current user to check their existing email and emp_id
    const currentUser = await User.findByPk(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }
    const effectiveEmpId = emp_id || currentUser.emp_id;

    // Check if status is changing to 'inactive' or 'terminated' and was previously 'active'
    const isBecomingFormerEmployee =
      status &&
      (status === "inactive" || status === "terminated") &&
      currentUser.status === "active";

    if (isBecomingFormerEmployee) {
      console.log(
        `Employee ${currentUser.emp_id} is becoming a former employee`
      );

      // Here we can add additional logic for handling former employees
      // For example, we might want to:
      // 1. Update related records
      // 2. Send notifications
      // 3. Archive specific data
      // 4. Remove active assignments

      // For now, we'll just log the change
      // In a real implementation, you might want to handle:
      // - Project allocations
      // - Task assignments
      // - Payroll processing
      // - Access permissions
    }

    // Check if another employee already has this email or emp_id (excluding current user)
    let whereClause = {
      [Op.or]: [{ email: email }, { emp_id: effectiveEmpId }],
    };

    // Exclude current user from the check
    whereClause.id = { [Op.ne]: userId };

    const existingUser = await User.findOne({
      where: whereClause,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "Another employee with this email or employee ID already exists",
      });
    }

    // Update password if provided
    let password_hash = currentUser.password_hash;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      password_hash = await bcrypt.hash(password, salt);
    }

    await recordPromotionHistory({
      userId,
      previousManagementRole: currentUser.management_role,
      managementRole: management_role,
      designation,
      effectiveDate: promotion_effective_date,
      joinedDate: joined_date,
    });

    // Update user
    console.log(`About to update user ${userId} with status:`, status);
    await currentUser.update({
      first_name,
      last_name: last_name || null,
      email,
      emp_id: effectiveEmpId,
      password_hash,
      status: status || currentUser.status, // Update status if provided, otherwise keep existing status
      designation: designation || null,
      management_role: management_role || null,
    role: role || currentUser.role,
      department_id: department_id || null,
    });
    console.log(
      `User ${userId} updated successfully. New status:`,
      await currentUser.reload().then((u) => u.status)
    );

    // Get or create employee detail
    let employeeDetail = await EmployeeDetail.findOne({
      where: { user_id: userId },
    });
    if (!employeeDetail) {
      employeeDetail = await EmployeeDetail.create({
        user_id: userId,
        gender: normalizedGender,
        dob: dob || null,
        phone: phone || null,
        address: address || null,
        joined_date: joined_date || null,
        end_date: end_date || null,
      });
    } else {
      await employeeDetail.update({
        gender: normalizedGender,
        dob: dob || null,
        phone: phone || null,
        address: address || null,
        joined_date: joined_date || null,
        end_date: end_date || null,
      });
    }

    // Get the updated user to return the current state
    const updatedUser = await User.findByPk(userId);

    res.status(200).json({
      success: true,
      message: "Employee personal information updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(
      error,
      "update employee personal info"
    );
    res.status(500).json(errorResponse);
  }
};

// @desc    Add employee educational information
// @route   POST /api/employees/:id/education
// @access  Private (Admin)
exports.addEmployeeEducation = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate input
    const { error } = educationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const { qualification, institution, year_of_completion } = req.body;

    // Create education record
    const education = await EmployeeHistory.create({
      user_id: userId,
      type: "education",
      qualification,
      institution,
      year_of_completion,
    });

    res.status(201).json({
      success: true,
      message: "Employee education information added successfully",
      data: {
        education,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(
      error,
      "add employee education"
    );
    res.status(500).json(errorResponse);
  }
};

// @desc    Update employee educational information
// @route   PUT /api/employees/:id/education/:educationId
// @access  Private (Admin)
exports.updateEmployeeEducation = async (req, res) => {
  try {
    const userId = req.params.id;
    const educationId = req.params.educationId;

    // Validate input
    const { error } = educationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Find the education record
    const education = await EmployeeHistory.findOne({
      where: {
        id: educationId,
        user_id: userId,
        type: "education"
      }
    });

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education record not found",
      });
    }

    const { qualification, institution, year_of_completion } = req.body;

    // Update education record
    await education.update({
      qualification,
      institution,
      year_of_completion,
    });

    res.status(200).json({
      success: true,
      message: "Employee education information updated successfully",
      data: {
        education,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(
      error,
      "update employee education"
    );
    res.status(500).json(errorResponse);
  }
};

// @desc    Add employee professional information
// @route   POST /api/employees/:id/professional
// @access  Private (Admin)
exports.addEmployeeProfessional = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate input
    const { error } = professionalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const { position, company_name, years_of_experience } = req.body;

    // Create professional record
    const professional = await EmployeeHistory.create({
      user_id: userId,
      type: "experience",
      position,
      company_name,
      years_of_experience,
    });

    res.status(201).json({
      success: true,
      message: "Employee professional information added successfully",
      data: {
        professional,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(
      error,
      "add employee professional"
    );
    res.status(500).json(errorResponse);
  }
};

// @desc    Update employee professional information
// @route   PUT /api/employees/:id/professional/:professionalId
// @access  Private (Admin)
exports.updateEmployeeProfessional = async (req, res) => {
  try {
    const userId = req.params.id;
    const professionalId = req.params.professionalId;

    // Validate input
    const { error } = professionalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if professional record exists and belongs to user
    const professional = await EmployeeHistory.findOne({
      where: {
        id: professionalId,
        user_id: userId,
        type: "experience"
      }
    });

    if (!professional) {
      return res.status(404).json({
        success: false,
        message: "Professional information not found",
      });
    }

    const { position, company_name, years_of_experience } = req.body;

    // Update professional record
    await professional.update({
      position,
      company_name,
      years_of_experience,
    });

    res.status(200).json({
      success: true,
      message: "Employee professional information updated successfully",
      data: {
        professional,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(
      error,
      "update employee professional"
    );
    res.status(500).json(errorResponse);
  }
};

// @desc    Get next available employee ID
// @route   GET /api/employees/next-emp-id
// @access  Private (Admin)
exports.getNextEmployeeId = async (req, res) => {
  try {
    const nextEmpId = await generateNextEmployeeId();

    res.status(200).json({
      success: true,
      data: {
        nextEmpId,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(error, "get next employee ID");
    res.status(500).json(errorResponse);
  }
};

// @desc    Upload employee document
// @route   POST /api/employees/:id/documents
// @access  Private (Admin)
exports.uploadEmployeeDocument = async (req, res) => {
  try {
    const userId = req.params.id;

    console.log("=== UPLOAD DOCUMENT DEBUG ===");
    console.log("UserID:", userId);
    console.log("Request body:", req.body);
    console.log("Document type from req.body.document_type:", req.body.document_type);
    console.log("File info:", req.file ? { 
      filename: req.file.filename, 
      originalname: req.file.originalname,
      size: req.file.size, 
      mimetype: req.file.mimetype,
      path: req.file.path 
    } : "No file");

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Get document type from request body
    const documentType = req.body.document_type;
    console.log("Document type to be saved:", documentType);

    // Validate document type
    if (
      ![
        "nic",
        "birth_certificate",
        "educational_certificate",
        "transcript",
      ].includes(documentType)
    ) {
      // Delete uploaded file
      const { deleteFile } = require("../utils/fileUpload");
      deleteFile(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Invalid document type",
      });
    }

    console.log(`Checking for existing ${documentType} document for user ${userId}...`);
    
    // Check if a document of this type already exists for this user
    const existingDocument = await Document.findOne({
      where: {
        user_id: userId,
        document_type: documentType
      }
    });

    if (existingDocument) {
      console.log(`Found existing document (ID: ${existingDocument.id}), replacing...`);
      
      // Delete the old file from disk
      const { deleteFile } = require("../utils/fileUpload");
      try {
        if (existingDocument.file_path) {
          deleteFile(existingDocument.file_path);
          console.log("✓ Deleted old file:", existingDocument.file_path);
        }
      } catch (deleteError) {
        console.error("⚠ Error deleting old file:", existingDocument.file_path, deleteError);
        // Continue anyway - we don't want to fail the upload if old file deletion fails
      }
      
      // Delete the old document record
      await existingDocument.destroy();
      console.log("✓ Deleted old document record:", existingDocument.id);
    } else {
      console.log(`No existing ${documentType} document found, creating new record`);
    }

    // Store only the relative path for the document, not the full absolute path
    const pathArray = req.file.path.split(/[\\/]/);
    const uploadsIndex = pathArray.lastIndexOf("uploads");
    const relativeDocumentPath =
      uploadsIndex !== -1
        ? pathArray.slice(uploadsIndex).join("/")
        : "uploads/" + req.file.filename;
    
    console.log("Creating document with path:", relativeDocumentPath);
    
    // Create document record
    const document = await Document.create({
      user_id: userId,
      document_type: documentType,
      file_path: relativeDocumentPath,
    });

    console.log("Document created successfully:", {
      id: document.id,
      document_type: document.document_type,
      file_path: document.file_path
    });
    console.log("=== END UPLOAD DOCUMENT DEBUG ===");

    res.status(201).json({
      success: true,
      message: "Employee document uploaded successfully",
      data: {
        document,
      },
    });
  } catch (error) {
    console.error("Error in uploadEmployeeDocument:", error);
    const errorResponse = handleControllerError(
      error,
      "upload employee document"
    );
    res.status(500).json(errorResponse);
  }
};

// @desc    Upload employee profile photo
// @route   POST /api/employees/:id/profile-photo
// @access  Private (Admin)
exports.uploadEmployeeProfilePhoto = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Check if uploaded file is an image
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedImageTypes.includes(req.file.mimetype)) {
      // Delete uploaded file
      const { deleteFile } = require("../utils/fileUpload");
      deleteFile(req.file.path);

      return res.status(400).json({
        success: false,
        message:
          "Only image files (JPEG, PNG, GIF, WEBP) are allowed for profile photos",
      });
    }

    // Get or create employee detail
    let employeeDetail = await EmployeeDetail.findOne({
      where: { user_id: userId },
    });
    if (!employeeDetail) {
      // Store only the relative path for the image, not the full absolute path
      // Extract just the filename from the full path
      const pathArray = req.file.path.split(/[\\/]/);
      const filename = pathArray[pathArray.length - 1];
      const relativeImagePath = "uploads/" + filename;
      employeeDetail = await EmployeeDetail.create({
        user_id: userId,
        image_path: relativeImagePath,
      });
    } else {
      // Delete old profile photo if exists
      if (employeeDetail.image_path) {
        const { deleteFile } = require("../utils/fileUpload");
        deleteFile(employeeDetail.image_path);
      }

      // Store only the relative path for the image, not the full absolute path
      // Extract just the filename from the full path
      const pathArray = req.file.path.split(/[\\/]/);
      const filename = pathArray[pathArray.length - 1];
      const relativeImagePath = "uploads/" + filename;
      // Update with new profile photo
      await employeeDetail.update({
        image_path: relativeImagePath,
      });
    }

    res.status(201).json({
      success: true,
      message: "Profile photo uploaded successfully",
      data: {
        profile_photo: employeeDetail.image_path,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(
      error,
      "upload employee profile photo"
    );
    res.status(500).json(errorResponse);
  }
};

// @desc    Set employee work information
// @route   POST /api/employees/:id/work-info
// @access  Private (Admin)
exports.setEmployeeWorkInfo = async (req, res) => {
  try {
    const userId = req.params.id;

    const {
      designation,
      role,
      department_id,
      management_role,
      promotion_effective_date,
      joined_date,
      end_date,
      report_to
    } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    const normalizedReportTo = normalizeOptionalId(report_to);

    if (role && !["admin", "employee"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role value. Allowed values are 'admin' or 'employee'.",
      });
    }

    await recordPromotionHistory({
      userId,
      previousManagementRole: user.management_role,
      managementRole: management_role,
      designation,
      effectiveDate: promotion_effective_date,
      joinedDate: joined_date,
    });

    // update user table
    await user.update({
      designation: designation || null,
      role: role || user.role,
      department_id: department_id || null,
      management_role: management_role || null,
      report_to: normalizedReportTo
    });

    // update employee details
    let employeeDetail = await EmployeeDetail.findOne({
      where: { user_id: userId }
    });

    if (!employeeDetail) {
      employeeDetail = await EmployeeDetail.create({
        user_id: userId,
        joined_date: joined_date || null,
        end_date: end_date || null
      });
    } else {
      await employeeDetail.update({
        joined_date: joined_date || null,
        end_date: end_date || null
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee work information saved successfully"
    });

  } catch (error) {
    console.error("setEmployeeWorkInfo error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set employee work info"
    });
  }
};
// @desc    Add employee project allocation
// @route   POST /api/employees/:id/project-allocation
// @access  Private (Admin)

exports.addEmployeeProjectAllocation = async (req, res) => {
  try {
    const userId = req.params.id;
    const { 
      current_project, 
      start_date, 
      report_to, 
      previous_projects, 
      completed_projects,
      project_role,
      project_description,
      project_contributions,
      technologies_used,
      allocation_start,
      allocation_end,
      allocated_hours
    } = req.body;
    const normalizedReportTo = normalizeOptionalId(report_to);

    console.log("=== PROJECT ALLOCATION DEBUG ===");
    console.log("userId:", userId);
    console.log("current_project:", current_project);
    console.log("start_date:", start_date);
    console.log("report_to:", report_to);
    console.log("previous_projects:", previous_projects);
    console.log("completed_projects:", completed_projects);
    console.log("project_role:", project_role);
    console.log("project_description:", project_description);
    console.log("project_contributions:", project_contributions);
    console.log("technologies_used:", technologies_used);
    console.log("allocation_start:", allocation_start);
    console.log("allocation_end:", allocation_end);
    console.log("allocated_hours:", allocated_hours);

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    console.log("Creating allocation with data:", {
      user_id: userId,
      project_id: null,
      current_project: current_project || null,
      start_date,
      report_to: normalizedReportTo,
      previous_projects: previous_projects || null,
      completed_projects: completed_projects || null,
      project_role: project_role || null,
      project_description: project_description || null,
      project_contributions: project_contributions || null,
      technologies_used: technologies_used || null,
      allocation_start: allocation_start || null,
      allocation_end: allocation_end || null,
      allocated_hours: allocated_hours || null
    });

    // Use findOrCreate to avoid duplicates when the frontend retries a create for
    // an employee that already has an allocation (e.g. stale state race condition).
    const [allocation, created] = await ProjectAllocation.findOrCreate({
      where: { user_id: userId, project_id: null },
      defaults: {
        user_id: userId,
        project_id: null,
        current_project: current_project || null,
        start_date,
        report_to: normalizedReportTo,
        previous_projects: previous_projects || null,
        completed_projects: completed_projects || null,
        project_role: project_role || null,
        project_description: project_description || null,
        project_contributions: project_contributions || null,
        technologies_used: technologies_used || null,
        allocation_start: allocation_start || null,
        allocation_end: allocation_end || null,
        allocated_hours: allocated_hours || null
      }
    });

    if (!created) {
      // Allocation already existed — update it instead
      console.log("⚠️ Allocation already exists for this employee, updating instead. ID:", allocation.id);
      allocation.current_project = current_project !== undefined ? (current_project || null) : allocation.current_project;
      allocation.start_date = start_date !== undefined ? start_date : allocation.start_date;
      allocation.report_to = report_to !== undefined ? normalizedReportTo : allocation.report_to;
      allocation.previous_projects = previous_projects !== undefined ? (previous_projects || null) : allocation.previous_projects;
      allocation.completed_projects = completed_projects !== undefined ? (completed_projects || null) : allocation.completed_projects;
      allocation.project_role = project_role !== undefined ? (project_role || null) : allocation.project_role;
      allocation.project_description = project_description !== undefined ? (project_description || null) : allocation.project_description;
      allocation.project_contributions = project_contributions !== undefined ? (project_contributions || null) : allocation.project_contributions;
      allocation.technologies_used = technologies_used !== undefined ? (technologies_used || null) : allocation.technologies_used;
      allocation.allocation_start = allocation_start !== undefined ? (allocation_start || null) : allocation.allocation_start;
      allocation.allocation_end = allocation_end !== undefined ? (allocation_end || null) : allocation.allocation_end;
      allocation.allocated_hours = allocated_hours !== undefined ? (allocated_hours || null) : allocation.allocated_hours;
      await allocation.save();
    }

    if (report_to !== undefined) {
      await user.update({ report_to: normalizedReportTo });
    }

    console.log("✅ Allocation created successfully:", {
      id: allocation.id,
      user_id: allocation.user_id,
      current_project: allocation.current_project,
      start_date: allocation.start_date,
      previous_projects: allocation.previous_projects,
      completed_projects: allocation.completed_projects,
      report_to: allocation.report_to
    });

    res.status(201).json({
      success: true,
      message: "Project allocation added",
      data: allocation
    });

  } catch (error) {
    console.error("Project allocation error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      original: error.original?.message,
      parent: error.parent?.message
    });
    res.status(500).json({
      success: false,
      message: "Failed to create allocation",
      error: error.message
    });
  }
};

exports.updateEmployeeProjectAllocation = async (req, res) => {
  try {
    console.log("=== UPDATE PROJECT ALLOCATION ROUTE HIT ===");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);
    
    const userId = req.params.id;
    const allocationId = req.params.allocationId;
    const { 
      current_project, 
      start_date, 
      report_to, 
      previous_projects, 
      completed_projects,
      project_role,
      project_description,
      project_contributions,
      technologies_used,
      allocation_start,
      allocation_end,
      allocated_hours
    } = req.body;
    const normalizedReportTo = normalizeOptionalId(report_to);

    console.log("=== UPDATE PROJECT ALLOCATION DEBUG ===");
    console.log("userId:", userId);
    console.log("allocationId:", allocationId);
    console.log("current_project:", current_project);
    console.log("start_date:", start_date);
    console.log("report_to:", report_to);
    console.log("previous_projects:", previous_projects);
    console.log("completed_projects:", completed_projects);
    console.log("project_role:", project_role);
    console.log("project_description:", project_description);
    console.log("project_contributions:", project_contributions);
    console.log("technologies_used:", technologies_used);
    console.log("allocation_start:", allocation_start);
    console.log("allocation_end:", allocation_end);
    console.log("allocated_hours:", allocated_hours);

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    let allocation = await ProjectAllocation.findOne({
      where: { id: allocationId, user_id: userId }
    });

    if (!allocation) {
      // The supplied allocationId doesn't match this employee (stale front-end state).
      // Try to recover by finding ANY allocation that belongs to this employee.
      console.warn(`⚠️  allocationId ${allocationId} not found for user ${userId} — attempting fallback lookup`);
      allocation = await ProjectAllocation.findOne({ where: { user_id: userId } });
    }

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: "Project allocation not found for this employee"
      });
    }

    console.log("🔍 VALIDATION CHECK:");
    console.log("  - allocation.id:", allocation.id, "allocation.user_id:", allocation.user_id);
    console.log("  - userId:", userId);
    console.log("  - Match:", allocation.user_id === Number(userId));

    console.log("Updating allocation with data:", {
      current_project,
      start_date,
      report_to: normalizedReportTo,
      previous_projects: previous_projects || null,
      completed_projects: completed_projects || null,
      project_role: project_role || null,
      project_description: project_description || null,
      project_contributions: project_contributions || null,
      technologies_used: technologies_used || null,
      allocation_start: allocation_start || null,
      allocation_end: allocation_end || null,
      allocated_hours: allocated_hours || null
    });

    // Update allocation fields - use explicit checks to allow empty strings
    // Convert empty strings to null for consistent database storage
    allocation.current_project = current_project !== undefined ? (current_project === "" ? null : current_project) : allocation.current_project;
    allocation.start_date = start_date !== undefined ? start_date : allocation.start_date;
    allocation.report_to = report_to !== undefined ? normalizedReportTo : allocation.report_to;
    allocation.previous_projects = previous_projects !== undefined ? (previous_projects === "" ? null : previous_projects) : allocation.previous_projects;
    allocation.completed_projects = completed_projects !== undefined ? (completed_projects === "" ? null : completed_projects) : allocation.completed_projects;
    allocation.project_role = project_role !== undefined ? (project_role === "" ? null : project_role) : allocation.project_role;
    allocation.project_description = project_description !== undefined ? (project_description === "" ? null : project_description) : allocation.project_description;
    allocation.project_contributions = project_contributions !== undefined ? (project_contributions === "" ? null : project_contributions) : allocation.project_contributions;
    allocation.technologies_used = technologies_used !== undefined ? (technologies_used === "" ? null : technologies_used) : allocation.technologies_used;
    allocation.allocation_start = allocation_start !== undefined ? allocation_start : allocation.allocation_start;
    allocation.allocation_end = allocation_end !== undefined ? allocation_end : allocation.allocation_end;
    allocation.allocated_hours = allocated_hours !== undefined ? allocated_hours : allocation.allocated_hours;

    console.log("💾 Saving allocation changes:", {
      allocation_id: allocation.id,
      current_project: allocation.current_project,
      start_date: allocation.start_date,
      previous_projects: allocation.previous_projects,
      completed_projects: allocation.completed_projects,
      report_to: allocation.report_to
    });

    await allocation.save();

    if (report_to !== undefined) {
      await user.update({ report_to: normalizedReportTo });
    }
    
    console.log("✅ Allocation saved successfully!");

    console.log("Allocation updated successfully:", allocation.toJSON());

    res.status(200).json({
      success: true,
      message: "Project allocation updated",
      data: allocation
    });

  } catch (error) {
    console.error("Project allocation update error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      original: error.original?.message,
      parent: error.parent?.message
    });
    res.status(500).json({
      success: false,
      message: "Failed to update allocation",
      error: error.message
    });
  }
};


// @desc    Get employee overview
// @route   GET /api/employees/:id
// @access  Private (Admin/Employee)
exports.getEmployeeOverview = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user with associated data
    console.log(`🔍 Fetching employee overview for userId: ${userId}`);
    let user;
    try {
      user = await User.findByPk(userId, {
      include: [
        {
          model: EmployeeDetail,
          as: "EmployeeDetail",
        },
        {
          model: EmployeeHistory,
          as: "EmployeeHistories",
        },
        {
          model: Document,
          as: "Documents",
        },
        {
          model: Department,
          as: "Department",
        },
        {
          model: User,
          as: "ReportTo",
          attributes: ["id", "first_name", "last_name", "emp_id"],
          include: [
            {
              model: EmployeeDetail,
              as: "EmployeeDetail",
              attributes: ["image_path"],
            },
          ],
        },
          {
            model: ProjectAllocation,
            as: "ProjectAllocations",
            include: [
              {
                model: Project,
                as: "Project",
                attributes: ["id", "project_name", "start_date", "end_date", "status"],
              },
            ],
            // Explicitly include all project allocation fields
            attributes: ['id', 'user_id', 'project_id', 'current_project', 'start_date', 
                        'previous_projects', 'completed_projects', 'project_role', 
                        'project_description', 'project_contributions', 'technologies_used',
                        'allocation_start', 'allocation_end', 'allocated_hours', 'report_to']
          },
      ],
      // Force Sequelize to log the query for debugging
      benchmark: true,
      logging: (message) => console.log("⏱️ DB Query Time:", message)
    });
    
    console.log("✅ User found:", user ? `Yes - ID: ${user.id}` : "No");
    } catch (error) {
      console.warn("Full employee overview query failed:", error.message);
      try {
        user = await User.findByPk(userId, {
          include: [
            {
              model: EmployeeDetail,
              as: "EmployeeDetail",
            },
            {
              model: Department,
              as: "Department",
            },
          ],
        });
      } catch (fallbackError) {
        console.warn("Minimal employee overview query failed:", fallbackError.message);
        user = await User.findByPk(userId);
      }
    }

    if (user?.ProjectAllocations?.length > 0) {
      const lastAlloc = user.ProjectAllocations[user.ProjectAllocations.length - 1];
      console.log("📊 Last Allocation Data (for Overview):", {
        id: lastAlloc.id,
        previous_projects: lastAlloc.previous_projects,
        completed_projects: lastAlloc.completed_projects,
        current_project: lastAlloc.current_project
      });
    } else {
      console.log("⚠️ No ProjectAllocations found for this user");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Separate education and professional experience
    const employeeHistories = Array.isArray(user.EmployeeHistories)
      ? user.EmployeeHistories
      : [];
    const education = employeeHistories.filter(
      (history) => history.type === "education"
    );
    const professional = employeeHistories.filter(
      (history) => history.type === "experience"
    );

    let promotionHistories = [];
    if (PromotionHistory) {
      try {
        promotionHistories = await PromotionHistory.findAll({
          where: { user_id: userId },
          order: [["effective_date", "ASC"], ["id", "ASC"]],
        });
      } catch (error) {
        console.warn("Promotion history unavailable:", error.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Employee overview retrieved successfully",
      data: {
        user: {
          id: user.id,
          emp_id: user.emp_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          status: user.status,
          department_id: user.department_id,
          designation: user.designation,
          management_role: user.management_role,
          report_to: user.report_to,
          created_at: user.created_at,
          updated_at: user.updated_at,
          Department: user.Department,
          EmployeeDetail: user.EmployeeDetail,
          profile_image: user.EmployeeDetail
            ? user.EmployeeDetail.image_path
            : null,
          ReportTo: user.ReportTo,
          education,
          professional,
          PromotionHistories: promotionHistories,
          Documents: user.Documents || [],
            ProjectAllocations: user.ProjectAllocations || [],
        },
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(error, "get employee overview");
    res.status(500).json(errorResponse);
  }
};

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Admin)
exports.getAllEmployees = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const offset = (page - 1) * limit;
    const status = req.query.status?.trim();
    const designation = req.query.designation?.trim();
    const managementRole = req.query.management_role?.trim();
    const search = req.query.search?.trim();

    const baseWhereClause = {};

    if (status) {
      if (status === "former") {
        baseWhereClause.status = { [Op.in]: ["inactive", "terminated"] };
      } else if (status.includes(",")) {
        baseWhereClause.status = {
          [Op.in]: status
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        };
      } else {
        baseWhereClause.status = status;
      }
    }

    const filterOptionRows = await User.findAll({
      where: baseWhereClause,
      attributes: ["designation", "role", "management_role"],
      raw: true,
    });

    const whereClause = { ...baseWhereClause };

    if (designation) {
      whereClause.designation = designation;
    }

    if (managementRole) {
      whereClause.management_role = managementRole;
    }

    if (req.query.role?.trim()) {
      whereClause.role = req.query.role.trim();
    }

    let searchOrder = [["created_at", "DESC"]];

    if (search) {
      const searchPattern = `%${search}%`;
      const fullNameSearchCondition = sequelize.where(
        sequelize.fn(
          "LOWER",
          sequelize.fn(
            "CONCAT_WS",
            " ",
            sequelize.col("User.first_name"),
            sequelize.col("User.last_name")
          )
        ),
        {
          [Op.like]: searchPattern.toLowerCase(),
        }
      );
      const managerMatches = await User.findAll({
        where: {
          [Op.or]: [
            { emp_id: { [Op.like]: searchPattern } },
            { first_name: { [Op.like]: searchPattern } },
            { last_name: { [Op.like]: searchPattern } },
            fullNameSearchCondition,
          ],
        },
        attributes: ["id"],
        raw: true,
      });
      const managerIds = managerMatches.map((manager) => manager.id);
      const searchConditions = [
        { emp_id: { [Op.like]: searchPattern } },
        { first_name: { [Op.like]: searchPattern } },
        { last_name: { [Op.like]: searchPattern } },
        fullNameSearchCondition,
        { email: { [Op.like]: searchPattern } },
        { designation: { [Op.like]: searchPattern } },
        { management_role: { [Op.like]: searchPattern } },
      ];

      if (managerIds.length > 0) {
        searchConditions.push({ report_to: { [Op.in]: managerIds } });
      }

      whereClause[Op.or] = searchConditions;

      const exactSearch = sequelize.escape(search.toLowerCase());
      const prefixSearch = sequelize.escape(`${search.toLowerCase()}%`);
      const containsSearch = sequelize.escape(`%${search.toLowerCase()}%`);
      const managerRank = managerIds.length
        ? `WHEN \`User\`.\`report_to\` IN (${managerIds.join(",")}) THEN 5`
        : "";

      searchOrder = [
        [
          sequelize.literal(`CASE
            WHEN LOWER(TRIM(CONCAT_WS(' ', \`User\`.\`first_name\`, \`User\`.\`last_name\`))) = ${exactSearch} THEN 0
            WHEN LOWER(\`User\`.\`first_name\`) = ${exactSearch} THEN 0
            WHEN LOWER(TRIM(CONCAT_WS(' ', \`User\`.\`first_name\`, \`User\`.\`last_name\`))) LIKE ${prefixSearch} THEN 1
            WHEN LOWER(\`User\`.\`first_name\`) LIKE ${prefixSearch} THEN 1
            WHEN LOWER(TRIM(CONCAT_WS(' ', \`User\`.\`first_name\`, \`User\`.\`last_name\`))) LIKE ${containsSearch} THEN 2
            WHEN LOWER(\`User\`.\`emp_id\`) = ${exactSearch} THEN 3
            WHEN LOWER(\`User\`.\`emp_id\`) LIKE ${prefixSearch} THEN 4
            ${managerRank}
            ELSE 6
          END`),
          "ASC",
        ],
        ["first_name", "ASC"],
        ["last_name", "ASC"],
        ["created_at", "DESC"],
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      limit,
      offset,
      where: whereClause,
      include: [
        {
          model: EmployeeDetail,
          as: "EmployeeDetail",
        },
        {
          model: Department,
          as: "Department",
        },
        {
          model: User,
          as: "ReportTo",
          attributes: ["id", "first_name", "last_name", "emp_id"],
          include: [
            {
              model: EmployeeDetail,
              as: "EmployeeDetail",
              attributes: ["image_path"],
            },
          ],
        },
      ],
      order: searchOrder,
    });

    // Format the response to include profile_image field for each employee
    const formattedEmployees = rows.map((emp) => {
      const employeeObj = emp.toJSON();
      // Add profile_image field for easy access in frontend
      employeeObj.profile_image = employeeObj.EmployeeDetail
        ? employeeObj.EmployeeDetail.image_path
        : null;
      return employeeObj;
    });

    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: {
        employees: formattedEmployees,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
        filter_options: {
          designations: [
            ...new Set(
              filterOptionRows
                .map((employee) => employee.designation)
                .filter(Boolean)
            ),
          ].sort(),
          roles: [
            ...new Set(
              filterOptionRows.map((employee) => employee.role).filter(Boolean)
            ),
          ].sort(),
          management_roles: [
            ...new Set(
              filterOptionRows
                .map((employee) => employee.management_role)
                .filter(Boolean)
            ),
          ].sort(),
        },
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(error, "get all employees");
    res.status(500).json(errorResponse);
  }
};

// @desc    Get total employee count
// @route   GET /api/employees/count
// @access  Private (Admin)
exports.getEmployeeCount = async (req, res) => {
  try {
    const status = req.query.status?.trim() || "active";
    const whereClause = {};

    if (status !== "all") {
      whereClause.status = status;
    }

    const count = await User.count({
      where: whereClause,
    });

    res.status(200).json({
      success: true,
      data: {
        count: count,
        status,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(error, "get employee count");
    res.status(500).json(errorResponse);
  }
};

// @desc    Get employee documents by employee ID
// @route   GET /api/employees/:id/documents
// @access  Private (Admin/Employee)
exports.getEmployeeDocuments = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Get documents for the user
    const documents = await Document.findAll({
      where: { user_id: userId },
      order: [['uploaded_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: "Employee documents retrieved successfully",
      data: {
        documents,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(
      error,
      "get employee documents"
    );
    res.status(500).json(errorResponse);
  }
};

// @desc    Update employee documents
// @route   PUT /api/employees/:id/documents
// @access  Private (Admin)
exports.updateEmployeeDocuments = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate input
    const { error } = updateDocumentsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const { documents } = req.body;

    // Get existing documents for this user
    const existingDocuments = await Document.findAll({
      where: { user_id: userId }
    });

    // Create a map of existing documents by type for easier comparison
    const existingDocsMap = {};
    existingDocuments.forEach(doc => {
      existingDocsMap[doc.document_type] = doc;
    });

    const updatedDocuments = [];

    // Process each document in the request
    for (const doc of documents) {
      if (existingDocsMap[doc.document_type]) {
        // Delete the old file if the file path is different
        if (existingDocsMap[doc.document_type].file_path !== doc.file_path) {
          const { deleteFile } = require("../utils/fileUpload");
          // Construct full path from relative path stored in database
          const fullPath = path.join(__dirname, "..", "..", existingDocsMap[doc.document_type].file_path);
          deleteFile(fullPath);
        }
        
        // Update existing document - only update file_path and uploaded_at
        const updatedDoc = await existingDocsMap[doc.document_type].update({
          file_path: doc.file_path,
          uploaded_at: new Date() // Update the uploaded_at field to current timestamp
        });
        updatedDocuments.push(updatedDoc);
      } else {
        // Create new document with current timestamp
        const newDoc = await Document.create({
          user_id: userId,
          document_type: doc.document_type,
          file_path: doc.file_path,
          uploaded_at: new Date() // Set the uploaded_at field to current timestamp
        });
        updatedDocuments.push(newDoc);
      }
    }

    res.status(200).json({
      success: true,
      message: "Employee documents updated successfully",
      data: {
        documents: updatedDocuments,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(
      error,
      "update employee documents"
    );
    res.status(500).json(errorResponse);
  }
};
