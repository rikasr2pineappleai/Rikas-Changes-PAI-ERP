const path = require('path');
const {
  User,
  EmployeeDetail,
  EmployeeHistory,
  Document,
  Department,
    ProjectAllocation,
    Project,
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

    // Check if employee already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: email }, { emp_id: emp_id }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Employee with this email or employee ID already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      first_name,
      last_name: last_name || null,
      email,
      emp_id,
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

    res.status(201).json({
      success: true,
      message: "Employee personal information created successfully",
      data: {
        user_id: user.id,
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
      [Op.or]: [{ email: email }, { emp_id: emp_id }],
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

    // Update user
    console.log(`About to update user ${userId} with status:`, status);
    await currentUser.update({
      first_name,
      last_name: last_name || null,
      email,
      emp_id,
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
    // Find all employee IDs that start with "PAI" followed by numbers
    const users = await User.findAll({
      attributes: ["emp_id"],
      where: {
        emp_id: {
          [Op.like]: "PAI%", // Find all emp_ids starting with "PAI"
        },
      },
    });

    // Extract the numeric part from each employee ID and find the highest
    let maxNum = 0;
    const paiRegex = /^PAI(\d{3})$/;

    users.forEach((user) => {
      const match = user.emp_id.match(paiRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });

    // Calculate the next number
    let nextNum = maxNum + 1;

    // Handle edge case where we've reached the maximum (PAI999)
    if (nextNum > 999) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum employee ID limit reached (PAI999). Cannot generate new IDs.",
      });
    }

    // Format the next employee ID with leading zeros (e.g., 1 -> 001, 10 -> 010)
    const nextEmpId = `PAI${String(nextNum).padStart(3, "0")}`;

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

    console.log("Upload document attempt - UserID:", userId);
    console.log("File info:", req.file ? { filename: req.file.filename, size: req.file.size, mimetype: req.file.mimetype } : "No file");
    console.log("Document type:", req.body.document_type);

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

    const documentType = req.body.document_type;

    // Validate document type
    if (
      ![
        "nic",
        "birth",
        "edu",
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

    // Store only the relative path for the document, not the full absolute path
    const pathArray = req.file.path.split(/[\\\/]/);
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

    console.log("Document created successfully:", document.id);

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

    // Validate input
    const { error } = workInfoSchema.validate(req.body);
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

    const {
      joined_date,
      designation,
      department_id,
      management_role,
      report_to,
    } = req.body;

    console.log("Work Info Data Received:", {
      joined_date,
      designation,
      department_id,
      management_role,
      report_to,
    });

    // Check if department exists (only if department_id is provided)
    if (department_id) {
      const department = await Department.findByPk(department_id);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: "Department not found",
        });
      }
    }

    // Update user with work information
    console.log("Updating user with:", {
      department_id,
      designation,
      management_role,
      report_to: report_to || null,
    });

    await user.update({
      department_id,
      designation,
      management_role,
      report_to: report_to || null,
    });

    // Reload user to verify update
    await user.reload();
    console.log("User after update:", {
      id: user.id,
      designation: user.designation,
      management_role: user.management_role,
      department_id: user.department_id,
      report_to: user.report_to,
    });

    // Update employee detail with joined date
    let employeeDetail = await EmployeeDetail.findOne({
      where: { user_id: userId },
    });
    if (employeeDetail) {
      await employeeDetail.update({
        joined_date,
      });
    } else {
      await EmployeeDetail.create({
        user_id: userId,
        joined_date,
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee work information set successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    const errorResponse = handleControllerError(
      error,
      "set employee work info"
    );
    res.status(500).json(errorResponse);
  }
};

// @desc    Get employee overview
// @route   GET /api/employees/:id
// @access  Private (Admin/Employee)
exports.getEmployeeOverview = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user with associated data
    const user = await User.findByPk(userId, {
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
          },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Separate education and professional experience
    const education = user.EmployeeHistories.filter(
      (history) => history.type === "education"
    );
    const professional = user.EmployeeHistories.filter(
      (history) => history.type === "experience"
    );

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
          Documents: user.Documents,
            ProjectAllocations: user.ProjectAllocations,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status; // Optional status filter (active, inactive, terminated)

    let whereClause = { role: "employee" };

    if (status) {
      whereClause.status = status;
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
      order: [["created_at", "DESC"]],
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
    const count = await User.count({
      where: {
        role: "employee",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        count: count,
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