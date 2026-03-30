const { Department, User } = require('../models');
const { Op } = require('sequelize'); // Add this import for Sequelize operators

// Error handler function
const handleControllerError = (error, operation) => {
  console.error(`${operation} error:`, error);
  return {
    success: false,
    message: `Server error during ${operation}`,
    error: process.env.NODE_ENV === "development"
      ? error.message
      : "Something went wrong",
  };
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (Admin)
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'first_name', 'last_name', 'emp_id'],
          required: false
        }
      ],
      order: [['dept_name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      message: 'Departments retrieved successfully',
      data: {
        departments: departments.map(dept => ({
          id: dept.id,
          name: dept.dept_name,
          hod_user_id: dept.hod_user_id,
          hod: dept.User ? {
            id: dept.User.id,
            name: `${dept.User.first_name} ${dept.User.last_name || ''}`.trim(),
            emp_id: dept.User.emp_id
          } : null,
          created_at: dept.created_at
        }))
      }
    });
  } catch (error) {
    const errorResponse = handleControllerError(error, "get all departments");
    res.status(500).json(errorResponse);
  }
};

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private (Admin)
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'first_name', 'last_name', 'emp_id'],
          required: false
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Department retrieved successfully',
      data: {
        department: {
          id: department.id,
          name: department.dept_name,
          hod_user_id: department.hod_user_id,
          hod: department.User ? {
            id: department.User.id,
            name: `${department.User.first_name} ${department.User.last_name || ''}`.trim(),
            emp_id: department.User.emp_id
          } : null,
          created_at: department.created_at
        }
      }
    });
  } catch (error) {
    const errorResponse = handleControllerError(error, "get department by ID");
    res.status(500).json(errorResponse);
  }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (Admin)
exports.createDepartment = async (req, res) => {
  try {
    const { dept_name, hod_user_id } = req.body;

    // Validate required fields
    if (!dept_name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    // Check if department already exists
    const existingDepartment = await Department.findOne({
      where: { dept_name: dept_name.trim() }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }

    const department = await Department.create({
      dept_name: dept_name.trim(),
      hod_user_id: hod_user_id || null
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: {
        department: {
          id: department.id,
          name: department.dept_name,
          hod_user_id: department.hod_user_id,
          created_at: department.created_at
        }
      }
    });
  } catch (error) {
    const errorResponse = handleControllerError(error, "create department");
    res.status(500).json(errorResponse);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin)
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { dept_name, hod_user_id } = req.body;

    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if new department name already exists (excluding current department)
    if (dept_name) {
      const existingDepartment = await Department.findOne({
        where: {
          dept_name: dept_name.trim(),
          id: { [Op.ne]: id }
        }
      });

      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name already exists'
        });
      }
    }

    await department.update({
      dept_name: dept_name ? dept_name.trim() : department.dept_name,
      hod_user_id: hod_user_id !== undefined ? hod_user_id : department.hod_user_id
    });

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: {
        department: {
          id: department.id,
          name: department.dept_name,
          hod_user_id: department.hod_user_id,
          created_at: department.created_at
        }
      }
    });
  } catch (error) {
    const errorResponse = handleControllerError(error, "update department");
    res.status(500).json(errorResponse);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has employees
    const employeesCount = await User.count({
      where: { department_id: id }
    });

    if (employeesCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department that has employees assigned to it'
      });
    }

    await department.destroy();

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    const errorResponse = handleControllerError(error, "delete department");
    res.status(500).json(errorResponse);
  }
};