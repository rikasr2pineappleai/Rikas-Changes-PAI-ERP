const models = require('../models');
const { OfferLetterTemplate, OfferLetterForm, User, Role, Department, EmployeeDetail } = models;
const { sequelize } = models;
const puppeteer = require('puppeteer');
const { Op } = require('sequelize');
const { handleControllerError } = require('../utils/errorHandler');
const { generateOfferLetterHTML } = require('../templates/offerLetterPDF');

const requiredOfferLetterFields = [
  { name: 'employeeName', label: 'Name' },
  { name: 'address', label: 'Address' },
  { name: 'letterDate', label: 'Date' },
  { name: 'position', label: 'Role' },
  { name: 'joiningDate', label: 'Date of Joining' },
  { name: 'endDate', label: 'Date of Ending' },
  { name: 'department', label: 'Department' },
  { name: 'reportingManager', label: 'Reporting Manager' },
  { name: 'reportingManagerEmail', label: 'Reporting Manager Email' }
];

const getOfferLetterValidationErrors = (data) => {
  const errors = {};

  requiredOfferLetterFields.forEach(({ name, label }) => {
    if (!String(data[name] || '').trim()) {
      errors[name] = `${label} is required`;
    }
  });

  if (
    data.reportingManagerEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.reportingManagerEmail)
  ) {
    errors.reportingManagerEmail = 'Enter a valid Reporting Manager Email';
  }

  return errors;
};

// Helper function to fetch employee details from database
const fetchEmployeeDetails = async (userId) => {
  try {
    console.log('Fetching employee details for userId:', userId);
    
    const employee = await User.findByPk(userId, {
      include: [
        {
          model: EmployeeDetail,
          as: 'EmployeeDetail',
          attributes: ['joined_date', 'address']
        },
        {
          model: Department,
          attributes: ['id', 'dept_name']
        },
        {
          model: User,
          as: 'ReportTo',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      attributes: ['id', 'emp_id', 'first_name', 'last_name', 'email', 'designation', 'department_id', 'report_to']
    });

    if (!employee) {
      console.log('Employee not found for userId:', userId);
      return null;
    }

    console.log('Employee found:', employee.first_name, employee.last_name);

    const reportingManager = employee.ReportTo || {};
    const lastName = employee.last_name && employee.last_name !== 'null' ? ` ${employee.last_name}` : '';
    
    return {
      employeeName: `${employee.first_name}${lastName}`.trim(),
      address: employee.EmployeeDetail?.address || '',
      position: employee.designation || '',
      department: employee.Department?.dept_name || '',
      joiningDate: employee.EmployeeDetail?.joined_date ? new Date(employee.EmployeeDetail.joined_date).toLocaleDateString('en-GB') : '',
      reportingManager: reportingManager.first_name ? `${reportingManager.first_name}${reportingManager.last_name && reportingManager.last_name !== 'null' ? ` ${reportingManager.last_name}` : ''}`.trim() : '',
      reportingManagerEmail: reportingManager.email || '',
      empId: employee.emp_id,
      userId: employee.id
    };
  } catch (error) {
    console.error('Error fetching employee details:', error);
    console.error('Error details:', error.message);
    return null;
  }
};

// Helper function to search employees by name
const searchEmployeesByName = async (searchName) => {
  try {
    console.log('Searching for employees with name:', searchName);
    
    const employees = await User.findAll({
      where: {
        [Op.or]: [
          {
            first_name: { [Op.like]: `%${searchName}%` }
          },
          {
            last_name: { [Op.like]: `%${searchName}%` }
          }
        ]
      },
      include: [
        {
          model: EmployeeDetail,
          as: 'EmployeeDetail',
          attributes: ['joined_date', 'address']
        },
        {
          model: Department,
          attributes: ['id', 'dept_name']
        },
        {
          model: User,
          as: 'ReportTo',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      attributes: ['id', 'emp_id', 'first_name', 'last_name', 'email', 'designation', 'department_id', 'report_to'],
      limit: 10
    });

    console.log('Search results found:', employees.length);

    if (!employees || employees.length === 0) {
      return [];
    }

    return employees.map(employee => {
      const reportingManager = employee.ReportTo || {};
      const lastName = employee.last_name && employee.last_name !== 'null' ? ` ${employee.last_name}` : '';
      const fullName = `${employee.first_name}${lastName}`.trim();
      
      return {
        userId: employee.id,
        empId: employee.emp_id,
        employeeName: fullName,
        address: employee.EmployeeDetail?.address || '',
        position: employee.designation || '',
        department: employee.Department?.dept_name || '',
        joiningDate: employee.EmployeeDetail?.joined_date ? new Date(employee.EmployeeDetail.joined_date).toLocaleDateString('en-GB') : '',
        reportingManager: reportingManager.first_name ? `${reportingManager.first_name}${reportingManager.last_name && reportingManager.last_name !== 'null' ? ` ${reportingManager.last_name}` : ''}`.trim() : '',
        reportingManagerEmail: reportingManager.email || ''
      };
    });
  } catch (error) {
    console.error('Error searching employees by name:', error);
    console.error('Error details:', error.message);
    return [];
  }
};

// @desc    Generate Offer Letter PDF
// @route   POST /api/templates/offer-letter/generate
// @access  Private (Admin)
exports.generateOfferLetterPDF = async (req, res) => {
  let browser;
  try {
    const { employee_id, ...manualOverrides } = req.body;

    // Fetch employee data from database if employee_id is provided
    let dbEmployeeData = {};
    if (employee_id) {
      dbEmployeeData = await fetchEmployeeDetails(employee_id) || {};
    }

    // Merge database data with manual overrides (manual overrides take precedence)
    const mergedData = {
      ...dbEmployeeData,
      ...manualOverrides,
      generatedBy: manualOverrides.generatedBy || 'HR Department'
    };

    // Validate that we have all required fields after merging
    const validationErrors = getOfferLetterValidationErrors(mergedData);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all mandatory offer letter fields',
        errors: validationErrors
      });
    }

    // Generate HTML content
    const htmlContent = generateOfferLetterHTML(mergedData);

    // Launch puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // Set viewport to exact Figma/PDF-point A4 dimensions (595 x 842)
    await page.setViewport({ width: 595, height: 842, deviceScaleFactor: 1 });
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF - exact 595 x 842 px, no margins (layout handled in HTML)
    const pdfBuffer = await page.pdf({
      width: '595px',
      height: '842px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=offer-letter-${mergedData.employeeName.replace(/\s+/g, '-')}.pdf`);
    
    res.send(pdfBuffer);

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    const errorResponse = handleControllerError(error, "generate offer letter PDF");
    res.status(500).json(errorResponse);
  }
};

// @desc    Generate Offer Letter HTML preview
// @route   POST /api/templates/offer-letter/preview
// @access  Private (Admin)
exports.generateOfferLetterPreview = async (req, res) => {
  try {
    const { employee_id, ...manualOverrides } = req.body;

    let dbEmployeeData = {};
    if (employee_id) {
      dbEmployeeData = await fetchEmployeeDetails(employee_id) || {};
    }

    const mergedData = {
      ...dbEmployeeData,
      ...manualOverrides,
      generatedBy: manualOverrides.generatedBy || 'HR Department'
    };

    const validationErrors = getOfferLetterValidationErrors(mergedData);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all mandatory offer letter fields',
        errors: validationErrors
      });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(generateOfferLetterHTML(mergedData));
  } catch (error) {
    const errorResponse = handleControllerError(error, "generate offer letter preview");
    res.status(500).json(errorResponse);
  }
};

// @desc    Save Offer Letter Template
// @route   POST /api/templates/offer-letter/template
// @access  Private (Admin)
exports.saveOfferLetterTemplate = async (req, res) => {
  try {
    const { role_id, department_id, responsibilities, status } = req.body;

    if (!role_id || !department_id) {
      return res.status(400).json({
        success: false,
        message: 'Role ID and Department ID are required'
      });
    }

    const template = await OfferLetterTemplate.create({
      role_id,
      department_id,
      responsibilities,
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Offer letter template created successfully',
      data: { template }
    });

  } catch (error) {
    const errorResponse = handleControllerError(error, "save offer letter template");
    res.status(500).json(errorResponse);
  }
};

// @desc    Get all Offer Letter Templates
// @route   GET /api/templates/offer-letter/templates
// @access  Private (Admin)
exports.getOfferLetterTemplates = async (req, res) => {
  try {
    const templates = await OfferLetterTemplate.findAll({
      include: [
        { model: Role, attributes: ['id', 'role_name'] },
        { model: Department, attributes: ['id', 'dept_name'] }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Offer letter templates retrieved successfully',
      data: { templates }
    });

  } catch (error) {
    const errorResponse = handleControllerError(error, "get offer letter templates");
    res.status(500).json(errorResponse);
  }
};

// @desc    Get all employees for dropdown
// @route   GET /api/templates/offer-letter/all-employees
// @access  Private (Admin)
exports.getAllEmployeesForDropdown = async (req, res) => {
  try {
    console.log('=== FETCH ALL EMPLOYEES ===');
    
    const employees = await User.findAll({
      include: [
        {
          model: EmployeeDetail,
          as: 'EmployeeDetail',
          attributes: ['joined_date', 'address']
        },
        {
          model: Department,
          attributes: ['id', 'dept_name']
        },
        {
          model: User,
          as: 'ReportTo',
          attributes: ['id', 'first_name', 'last_name', 'email']
        }
      ],
      attributes: ['id', 'emp_id', 'first_name', 'last_name', 'email', 'designation', 'department_id', 'report_to'],
      order: [['first_name', 'ASC']],
      limit: 200
    });

    console.log('Total employees fetched:', employees.length);

    const employeeList = employees.map(employee => {
      const reportingManager = employee.ReportTo || {};
      const lastName = employee.last_name && employee.last_name !== 'null' ? ` ${employee.last_name}` : '';
      const fullName = `${employee.first_name}${lastName}`.trim();
      
      return {
        userId: employee.id,
        empId: employee.emp_id,
        employeeName: fullName,
        address: employee.EmployeeDetail?.address || '',
        position: employee.designation || '',
        department: employee.Department?.dept_name || '',
        joiningDate: employee.EmployeeDetail?.joined_date ? new Date(employee.EmployeeDetail.joined_date).toLocaleDateString('en-GB') : '',
        reportingManager: reportingManager.first_name ? `${reportingManager.first_name}${reportingManager.last_name && reportingManager.last_name !== 'null' ? ` ${reportingManager.last_name}` : ''}`.trim() : '',
        reportingManagerEmail: reportingManager.email || ''
      };
    });

    res.status(200).json({
      success: true,
      message: `Retrieved ${employeeList.length} employees`,
      data: employeeList,
      count: employeeList.length
    });

  } catch (error) {
    console.error('Error fetching all employees:', error);
    const errorResponse = handleControllerError(error, "get all employees for dropdown");
    res.status(500).json(errorResponse);
  }
};

// @desc    Get Employee Details for Offer Letter Form
// @route   GET /api/templates/offer-letter/employee/:employee_id
// @access  Private (Admin)
exports.getEmployeeDetailsForOfferLetter = async (req, res) => {
  try {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    const employeeDetails = await fetchEmployeeDetails(employee_id);

    if (!employeeDetails) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee details retrieved successfully',
      data: employeeDetails
    });

  } catch (error) {
    const errorResponse = handleControllerError(error, "get employee details for offer letter");
    res.status(500).json(errorResponse);
  }
};

// @desc    DEBUG: List all employees with basic info
// @route   GET /api/templates/offer-letter/debug/list-all-employees
// @access  Private (Admin)
exports.debugListAllEmployees = async (req, res) => {
  try {
    console.log('=== DEBUG: Listing all employees ===');
    
    const employees = await User.findAll({
      include: [
        {
          model: EmployeeDetail,
          as: 'EmployeeDetail',
          attributes: ['joined_date', 'address']
        },
        {
          model: Department,
          attributes: ['id', 'dept_name']
        }
      ],
      attributes: ['id', 'emp_id', 'first_name', 'last_name', 'email', 'designation', 'department_id'],
      limit: 50
    });

    console.log('Total employees found:', employees.length);
    
    const employeeList = employees.map(emp => ({
      userId: emp.id,
      empId: emp.emp_id,
      name: `${emp.first_name} ${emp.last_name || ''}`.trim(),
      email: emp.email,
      designation: emp.designation,
      department: emp.Department?.dept_name || 'N/A',
      address: emp.EmployeeDetail?.address || 'N/A',
      joinedDate: emp.EmployeeDetail?.joined_date || 'N/A'
    }));

    res.status(200).json({
      success: true,
      message: `Found ${employeeList.length} employees`,
      data: employeeList,
      totalCount: employeeList.length
    });

  } catch (error) {
    console.error('Debug error:', error);
    const errorResponse = handleControllerError(error, "debug list employees");
    res.status(500).json(errorResponse);
  }
};
