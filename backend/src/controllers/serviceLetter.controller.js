const { ServiceLetterTemplate, ServiceLetterForm, Role, Department, User, EmployeeDetail, sequelize } = require('../models');
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

const fs = require('fs');

const getPuppeteerLaunchOptions = () => {
  const options = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };

  const possiblePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : null
  ].filter(Boolean);

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      options.executablePath = p;
      break;
    }
  }

  return options;
};

const createServiceLetterPDFBuffer = async (data) => {
  const htmlContent = generateServiceLetterHTML(data);

  const launchOptions = getPuppeteerLaunchOptions();
  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (launchErr) {
    // If custom path failed, retry default
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

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
    if (browser) {
      await browser.close();
    }
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
      designation: user.designation || '',
      department: user.Department?.dept_name || '',
      joiningDate: joiningDate ? (typeof joiningDate === 'string' ? joiningDate.split('T')[0] : new Date(joiningDate).toISOString().split('T')[0]) : '',
      endDate: endDate ? (typeof endDate === 'string' ? endDate.split('T')[0] : new Date(endDate).toISOString().split('T')[0]) : '',
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
    userId: employeeDetails.userId || employee_id || undefined,
    employeeName: manualOverrides.employeeName || employeeDetails.employeeName,
    position: manualOverrides.position || employeeDetails.position || employeeDetails.designation,
    department: manualOverrides.department || employeeDetails.department,
    joiningDate: manualOverrides.joiningDate || employeeDetails.joiningDate,
    endDate: manualOverrides.endDate || employeeDetails.endDate,
    employeeEmail: manualOverrides.employeeEmail || employeeDetails.employeeEmail
  };
};

// Helper function to get all employees for dropdown with full details
const fetchAllEmployeesForServiceLetterDropdown = async () => {
  try {
    const employees = await User.findAll({
      include: [
        {
          model: EmployeeDetail,
          attributes: ['joined_date', 'end_date', 'address']
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

    return employees.map(employee => {
      const firstName = employee.first_name || '';
      const lastName = employee.last_name && employee.last_name !== 'null' ? ` ${employee.last_name}` : '';
      const fullName = `${firstName}${lastName}`.trim();
      const joiningDate = employee.EmployeeDetail?.joined_date;
      const endDate = employee.EmployeeDetail?.end_date;

      return {
        userId: employee.id,
        empId: employee.emp_id,
        employeeName: fullName,
        designation: employee.designation || '',
        position: employee.designation || '',
        department: employee.Department?.dept_name || '',
        email: employee.email || '',
        employeeEmail: employee.email || '',
        joiningDate: joiningDate ? (typeof joiningDate === 'string' ? joiningDate.split('T')[0] : new Date(joiningDate).toISOString().split('T')[0]) : '',
        endDate: endDate ? (typeof endDate === 'string' ? endDate.split('T')[0] : new Date(endDate).toISOString().split('T')[0]) : '',
        address: employee.EmployeeDetail?.address || ''
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
    const fileName = `service-letter-${(data.employeeName || 'employee').replace(/\s+/g, '-')}.pdf`;

    // Persist to ServiceLetterForm table if user exists
    if (data.userId && ServiceLetterForm) {
      try {
        await ServiceLetterForm.create({
          user_id: data.userId,
          letter_date: data.letterDate || new Date().toISOString().split('T')[0],
          generated_by: req.user?.id || data.userId || 1,
          file_path: fileName,
          status: 'draft'
        });
      } catch (dbErr) {
        console.warn('Could not save ServiceLetterForm record:', dbErr.message);
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileName}`
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

    if (data.userId && ServiceLetterForm) {
      try {
        await ServiceLetterForm.create({
          user_id: data.userId,
          letter_date: data.letterDate || new Date().toISOString().split('T')[0],
          generated_by: req.user?.id || data.userId || 1,
          file_path: `service-letter-${safeFileName}.pdf`,
          status: 'sent'
        });
      } catch (dbErr) {
        console.warn('Could not save ServiceLetterForm record:', dbErr.message);
      }
    }

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
