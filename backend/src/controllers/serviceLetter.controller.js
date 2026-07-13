const { ServiceLetterTemplate, Role, Department, User, EmployeeDetail, sequelize } = require('../models');
const puppeteer = require('puppeteer');
const { handleControllerError } = require('../utils/errorHandler');
const { Op } = require('sequelize');
const { generateServiceLetterHTML } = require('../templates/serviceLetterPDF');
const MailService = require('../services/MailService');

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

const getServiceLetterEmailValidationErrors = (data) => {
  const errors = getServiceLetterValidationErrors(data);

  if (!String(data.employeeEmail || '').trim()) {
    errors.employeeName = 'Employee email was not found for this Name';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.employeeEmail)) {
    errors.employeeEmail = 'Enter a valid Employee Email';
  }

  return errors;
};

const createServiceLetterPDFBuffer = async (data) => {
  const htmlContent = generateServiceLetterHTML(data);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 595, height: 842, deviceScaleFactor: 1 });
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    return await page.pdf({
      width: '595px',
      height: '842px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
  } finally {
    await browser.close();
  }
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getServiceLetterEmailBody = (employeeName) =>
  `Hi,\n\nPlease find the service letter for ${employeeName} attached.\n\nRegards,\nPineappleAI HR`;

const getServiceLetterEmailHtml = (employeeName) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.5;">
    <p>Hi,</p>
    <p>Please find the service letter for ${escapeHtml(employeeName)} attached.</p>
    <p>Regards,<br>PineappleAI HR</p>
  </div>
`;

const getServiceLetterEmailErrorMessage = (error) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const detail = error.message ? ` (${error.message})` : '';

  if (error.code === 'EMAIL_CONFIG_MISSING') {
    return error.message;
  }

  if (error.code === 'EAUTH') {
    return `Email authentication failed. Please check the SMTP username and app password.${isProduction ? '' : detail}`;
  }

  if (['ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'ENOTFOUND', 'ECONNREFUSED'].includes(error.code)) {
    return `Could not connect to the email server. Please check the SMTP host, port, and network access.${isProduction ? '' : detail}`;
  }

  if (error.code === 'EENVELOPE') {
    return `Email recipient/sender setup failed. Please check sender and recipient email addresses.${isProduction ? '' : detail}`;
  }

  return isProduction ? 'Failed to send service letter email.' : `Failed to send service letter email.${detail}`;
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
      empId: user.emp_id,
      employeeEmail: user.email || ''
    };
  } catch (error) {
    console.error('Error fetching employee details for service letter:', error);
    return null;
  }
};

const normalizeEmployeeName = (value) =>
  String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

const fetchEmployeeDetailsByNameForServiceLetter = async (employeeName) => {
  const normalizedName = normalizeEmployeeName(employeeName);
  if (!normalizedName) return null;

  const searchTerms = normalizedName.split(' ').filter(Boolean);
  const employees = await User.findAll({
    where: {
      [Op.or]: searchTerms.flatMap((term) => [
        { first_name: { [Op.like]: `%${term}%` } },
        { last_name: { [Op.like]: `%${term}%` } }
      ])
    },
    attributes: ['id', 'first_name', 'last_name', 'email'],
    limit: 50
  });

  const exactMatch = employees.find((employee) => {
    const firstName = employee.first_name || '';
    const lastName = employee.last_name && employee.last_name !== 'null' ? ` ${employee.last_name}` : '';
    return normalizeEmployeeName(`${firstName}${lastName}`) === normalizedName;
  });

  if (!exactMatch || !exactMatch.email) {
    return null;
  }

  return fetchEmployeeDetailsForServiceLetter(exactMatch.id);
};

const getMergedServiceLetterData = async (data) => {
  const { employee_id, ...manualOverrides } = data;

  let employeeDetails = {};
  if (employee_id) {
    employeeDetails = await fetchEmployeeDetailsForServiceLetter(employee_id) || {};
  } else if (!manualOverrides.employeeEmail && manualOverrides.employeeName) {
    employeeDetails = await fetchEmployeeDetailsByNameForServiceLetter(manualOverrides.employeeName) || {};
  }

  return {
    ...employeeDetails,
    ...manualOverrides,
    employeeName: manualOverrides.employeeName || employeeDetails.employeeName,
    position: manualOverrides.position || employeeDetails.position,
    department: manualOverrides.department || employeeDetails.department,
    joiningDate: manualOverrides.joiningDate || employeeDetails.joiningDate,
    endDate: manualOverrides.endDate || employeeDetails.endDate,
    employeeEmail: manualOverrides.employeeEmail || employeeDetails.employeeEmail
  };
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
    const data = await getMergedServiceLetterData(req.body);
    console.log('Received service letter data:', JSON.stringify(data, null, 2));

    // Validate required fields
    const validationErrors = getServiceLetterValidationErrors(data);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all mandatory service letter fields',
        errors: validationErrors
      });
    }

    const pdfBuffer = await createServiceLetterPDFBuffer(data);

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
    const data = await getMergedServiceLetterData(req.body);

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

// @desc    Email generated Service Letter PDF to employee
// @route   POST /api/templates/service-letter/email
// @access  Private (Admin)
exports.sendServiceLetterEmail = async (req, res) => {
  try {
    const data = await getMergedServiceLetterData(req.body);
    const validationErrors = getServiceLetterEmailValidationErrors(data);

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all mandatory service letter email fields',
        errors: validationErrors
      });
    }

    const pdfBuffer = await createServiceLetterPDFBuffer(data);
    const employeeName = data.employeeName.trim();
    const recipientEmail = data.employeeEmail.trim();
    const safeFileName = employeeName.replace(/\s+/g, '-');

    await MailService.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: recipientEmail,
      replyTo: process.env.HR_EMAIL || process.env.FROM_EMAIL || process.env.SMTP_USER,
      subject: 'Service letter',
      text: getServiceLetterEmailBody(employeeName),
      html: getServiceLetterEmailHtml(employeeName),
      attachments: [
        {
          filename: `service-letter-${safeFileName}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Service letter email sent successfully.'
    });
  } catch (error) {
    console.error('Service letter email error:', error);
    return res.status(500).json({
      success: false,
      message: getServiceLetterEmailErrorMessage(error),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
