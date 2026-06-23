const { ServiceLetterTemplate, Role, Department, User, EmployeeDetail, sequelize } = require('../models');
const puppeteer = require('puppeteer');
const { handleControllerError } = require('../utils/errorHandler');
const { Op } = require('sequelize');
const { generateServiceLetterHTML } = require('../templates/serviceLetterPDF');

const requiredServiceLetterFields = [
  { name: 'employeeName', label: 'Name' },
  { name: 'position', label: 'Designation' },
  { name: 'department', label: 'Department' },
  { name: 'letterDate', label: 'Date' },
  { name: 'joiningDate', label: 'Date of Joining' },
  { name: 'endDate', label: 'Date of Ending' },
  { name: 'responsibilities', label: 'Responsibilities' }
];

const getServiceLetterValidationErrors = (data) => {
  const errors = {};

  requiredServiceLetterFields.forEach(({ name, label }) => {
    if (!String(data[name] || '').trim()) {
      errors[name] = name === 'responsibilities'
        ? `${label} are required`
        : `${label} is required`;
    }
  });

  return errors;
};

// Helper function to fetch employee details with all associations
const fetchEmployeeDetailsForServiceLetter = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: EmployeeDetail,
          attributes: ['joined_date', 'address', 'end_date']
        },
        {
          model: Department,
          attributes: ['dept_name']
        },
        {
          model: User,
          as: 'ReportTo',
          attributes: ['first_name', 'last_name', 'email']
        }
      ],
      attributes: ['id', 'first_name', 'last_name', 'email', 'designation', 'emp_id']
    });

    if (!user) {
      return null;
    }

    const joiningDate = user.EmployeeDetail?.joined_date;
    const endDate = user.EmployeeDetail?.end_date;
    const reportingManager = user.ReportTo && user.ReportTo.first_name
      ? `${user.ReportTo.first_name}${user.ReportTo.last_name && user.ReportTo.last_name !== 'null' ? ` ${user.ReportTo.last_name}` : ''}`.trim()
      : '';
    const reportingManagerEmail = user.ReportTo?.email || '';

    const firstName = user.first_name || '';
    const lastName = user.last_name && user.last_name !== 'null' ? ` ${user.last_name}` : '';
    const fullName = `${firstName}${lastName}`.trim();

    return {
      userId: user.id,
      employeeName: fullName,
      address: user.EmployeeDetail?.address || '',
      position: user.designation || '',
      department: user.Department?.dept_name || '',
      joiningDate: joiningDate ? joiningDate.toISOString().split('T')[0] : '',
      endDate: endDate ? endDate.toISOString().split('T')[0] : '',
      reportingManager,
      reportingManagerEmail,
      empId: user.emp_id
    };
  } catch (error) {
    console.error('Error fetching employee details for service letter:', error);
    return null;
  }
};

// Helper function to get all employees for dropdown
const fetchAllEmployeesForServiceLetterDropdown = async () => {
  try {
    const employees = await User.findAll({
      attributes: ['id', 'first_name', 'last_name', 'designation', 'email'],
      order: [['first_name', 'ASC']],
      limit: 200
    });

    return employees.map(employee => {
      const firstName = employee.first_name || '';
      const lastName = employee.last_name && employee.last_name !== 'null' ? ` ${employee.last_name}` : '';
      const fullName = `${firstName}${lastName}`.trim();

      console.log('Mapping employee:', { id: employee.id, firstName, rawLastName: employee.last_name, lastName, fullName });

      return {
        userId: employee.id,
        employeeName: fullName,
        designation: employee.designation || '',
        email: employee.email || ''
      };
    });
  } catch (error) {
    console.error('Error fetching employees for dropdown:', error);
    return [];
  }
};

// @desc    Generate Service Letter PDF
// @route   POST /api/templates/service-letter/generate
// @access  Private (Admin)
exports.generateServiceLetterPDF = async (req, res) => {
  try {
    let data = req.body;
    console.log('Received service letter data:', JSON.stringify(data, null, 2));

    // If employee_id is provided, fetch details from database
    if (data.employee_id) {
      const employeeDetails = await fetchEmployeeDetailsForServiceLetter(data.employee_id);
      if (employeeDetails) {
        // Merge database data with form data (form data takes precedence)
        data = {
          ...employeeDetails,
          ...data,
          employeeName: data.employeeName || employeeDetails.employeeName,
          position: data.position || employeeDetails.position,
          department: data.department || employeeDetails.department,
          joiningDate: data.joiningDate || employeeDetails.joiningDate,
          endDate: data.endDate || employeeDetails.endDate
        };
      }
    }

    // Validate required fields
    const validationErrors = getServiceLetterValidationErrors(data);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all mandatory service letter fields',
        errors: validationErrors
      });
    }

    // Generate HTML, then render via puppeteer
    const htmlContent = generateServiceLetterHTML(data);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    let pdfBuffer;
    try {
      const page = await browser.newPage();
      // Set viewport to exact Figma/PDF-point A4 dimensions (595 × 842)
      await page.setViewport({ width: 595, height: 842, deviceScaleFactor: 1 });
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      // Exact 595 × 842 px, no margins (layout handled in HTML)
      pdfBuffer = await page.pdf({
        width: '595px',
        height: '842px',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
    } finally {
      await browser.close();
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=service-letter-${(data.employeeName || 'employee').replace(/\s+/g, '-')}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Service letter PDF error:', error);
    const errorResponse = handleControllerError(error, 'generate service letter PDF');
    res.status(500).json(errorResponse);
  }
};

// @desc    Generate Service Letter HTML preview
// @route   POST /api/templates/service-letter/preview
// @access  Private (Admin)
exports.generateServiceLetterPreview = async (req, res) => {
  try {
    let data = req.body;

    if (data.employee_id) {
      const employeeDetails = await fetchEmployeeDetailsForServiceLetter(data.employee_id);
      if (employeeDetails) {
        data = {
          ...employeeDetails,
          ...data,
          employeeName: data.employeeName || employeeDetails.employeeName,
          position: data.position || employeeDetails.position,
          department: data.department || employeeDetails.department,
          joiningDate: data.joiningDate || employeeDetails.joiningDate,
          endDate: data.endDate || employeeDetails.endDate
        };
      }
    }

    const validationErrors = getServiceLetterValidationErrors(data);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all mandatory service letter fields',
        errors: validationErrors
      });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(generateServiceLetterHTML(data));
  } catch (error) {
    console.error('Service letter preview error:', error);
    const errorResponse = handleControllerError(error, 'generate service letter preview');
    res.status(500).json(errorResponse);
  }
};

// @desc    Save Service Letter Template
// @route   POST /api/templates/service-letter/template
// @access  Private (Admin)
exports.saveServiceLetterTemplate = async (req, res) => {
  try {
    const { role_id, department_id, designation, responsibilities, status } = req.body;

    if (!role_id || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Role ID and Department ID are required'
      });
    }

    const template = await ServiceLetterTemplate.create({
      role_id,
      department_id,
      designation,
      responsibilities,
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Service letter template created successfully',
      data: { template }
    });

  } catch (error) {
    const errorResponse = handleControllerError(error, "save service letter template");
    res.status(500).json(errorResponse);
  }
};

// @desc    Get all Service Letter Templates
// @route   GET /api/templates/service-letter/templates
// @access  Private (Admin)
exports.getServiceLetterTemplates = async (req, res) => {
  try {
    const templates = await ServiceLetterTemplate.findAll({
      include: [
        { model: Role, attributes: ['id', 'role_name'] },
        { model: Department, attributes: ['id', 'dept_name'] }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Service letter templates retrieved successfully',
      data: { templates }
    });

  } catch (error) {
    const errorResponse = handleControllerError(error, "get service letter templates");
    res.status(500).json(errorResponse);
  }
};

// @desc    Get all employees for Service Letter dropdown
// @route   GET /api/templates/service-letter/all-employees
// @access  Private (Admin)
exports.getAllEmployeesForServiceLetterDropdown = async (req, res) => {
  try {
    console.log('=== FETCH SERVICE LETTER EMPLOYEES ===');
    const employees = await fetchAllEmployeesForServiceLetterDropdown();
    console.log(`Found ${employees.length} employees`);
    console.log('Sample employee data:', employees.slice(0, 3));
    res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      data: { employees, count: employees.length }
    });
  } catch (error) {
    console.error('Error in getAllEmployeesForServiceLetterDropdown:', error);
    const errorResponse = handleControllerError(error, "get employees for service letter dropdown");
    res.status(500).json(errorResponse);
  }
};

// @desc    Debug: Get all employees for Service Letter (no auth required)
// @route   GET /api/templates/service-letter/debug/all-employees
// @access  Public (Debug only)
exports.debugServiceLetterEmployees = async (req, res) => {
  try {
    console.log('=== DEBUG: FETCH SERVICE LETTER EMPLOYEES ===');
    const employees = await fetchAllEmployeesForServiceLetterDropdown();
    console.log(`Found ${employees.length} employees`);
    console.log('Sample employee data:', employees.slice(0, 3));
    res.status(200).json({
      success: true,
      message: 'Employees retrieved successfully',
      data: { employees, count: employees.length }
    });
  } catch (error) {
    console.error('Error in debugServiceLetterEmployees:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching employees',
      error: error
    });
  }
};

// @desc    Get specific employee details for Service Letter
// @route   GET /api/templates/service-letter/employee/:employee_id
// @access  Private (Admin)
exports.getEmployeeDetailsForServiceLetter = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const employeeDetails = await fetchEmployeeDetailsForServiceLetter(employee_id);

    if (!employeeDetails) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee details retrieved successfully',
      data: { employee: employeeDetails }
    });
  } catch (error) {
    const errorResponse = handleControllerError(error, "get employee details for service letter");
    res.status(500).json(errorResponse);
  }
};
