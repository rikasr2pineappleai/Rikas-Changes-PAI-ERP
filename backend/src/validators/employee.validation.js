const Joi = require('joi');

const employeeNamePattern =
  /^\p{L}[\p{L}\p{M}]*(?: \p{L}[\p{L}\p{M}]*)*$/u;
const employeeNameMessages = {
  'string.empty': 'Name is required',
  'string.max': 'Name cannot exceed 50 characters',
  'string.pattern.base': 'Name can contain letters and single spaces only'
};
const phonePattern = /^\+94 \d{2} \d{7}$/;
const phoneMessage = 'Phone number must follow +94 XX XXXXXXX format (e.g., +94 77 1234567).';

// Validation for personal information
const personalInfoSchema = Joi.object({
  first_name: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(employeeNamePattern)
    .required()
    .messages(employeeNameMessages),
  last_name: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(employeeNamePattern)
    .optional()
    .allow(null, '')
    .messages(employeeNameMessages),
  email: Joi.string().email().required(),
  emp_id: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[A-Za-z0-9._-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Employee ID can only contain letters, numbers, dots, underscores, and hyphens',
      'string.min': 'Employee ID must be at least 3 characters long',
      'string.max': 'Employee ID cannot exceed 30 characters'
    }),
  gender: Joi.string().valid('male', 'female', 'other').optional().allow(null),
  dob: Joi.date().iso().optional().allow(null),
  phone: Joi.string()
    .pattern(phonePattern)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': phoneMessage
    }),
  address: Joi.string().optional().allow(null, ''),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    })
});

// Validation for educational information
const educationSchema = Joi.object({
  qualification: Joi.string().min(1).max(100).required(),
  institution: Joi.string().min(1).max(150).required(),
  year_of_completion: Joi.number().integer().min(1900).max(2100).required()
});

// Validation for professional information
const professionalSchema = Joi.object({
  position: Joi.string().min(1).max(100).required(),
  company_name: Joi.string().min(1).max(150).required(),
  years_of_experience: Joi.number().min(0).max(50).required()
});

// Validation for work information
const workInfoSchema = Joi.object({
  joined_date: Joi.date().iso().required(),
  designation: Joi.string().min(1).max(100).required(),

  department_id: Joi.number().integer().positive().optional().allow(null),

  management_role: Joi.string().min(1).max(100).optional().allow(null, ""),

  report_to: Joi.number().integer().positive().optional().allow(null),

  // ✅ ADD THESE
  current_project: Joi.string().max(200).optional().allow(null, ""),
  start_date: Joi.date().iso().optional().allow(null),
});

// Validation for document upload
const documentSchema = Joi.object({
  document_type: Joi.string().valid('nic', 'birth_certificate', 'educational_certificate', 'transcript').required()
});

// Validation for updating documents
const updateDocumentsSchema = Joi.object({
  documents: Joi.array().items(
    Joi.object({
      document_type: Joi.string().valid('nic', 'birth_certificate', 'educational_certificate', 'transcript').required(),
      file_path: Joi.string().required()
    })
  ).required()
});

// Validation for updating personal information (password optional)
const updatePersonalInfoSchema = Joi.object({
  first_name: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .pattern(employeeNamePattern)
    .required()
    .messages(employeeNameMessages),
  last_name: Joi.string()
    .trim()
    .max(50)
    .pattern(employeeNamePattern)
    .optional()
    .allow(null, '')
    .messages(employeeNameMessages),
  email: Joi.string().required(),
  emp_id: Joi.string()
    .empty('')
    .allow(null)
    .min(3)
    .max(30)
    .pattern(/^[A-Za-z0-9._-]+$/)
    .optional()
    .messages({
      'string.pattern.base': 'Employee ID can only contain letters, numbers, dots, underscores, and hyphens',
      'string.min': 'Employee ID must be at least 3 characters long',
      'string.max': 'Employee ID cannot exceed 30 characters'
    }),
  gender: Joi.string().valid('male', 'female', 'other').optional().allow(null, ''),
  dob: Joi.string().optional().allow(null, ''),
  phone: Joi.string()
    .pattern(phonePattern)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': phoneMessage
    }),
  address: Joi.string().optional().allow(null, ''),
  designation: Joi.string().max(100).optional().allow(null, ''),
  management_role: Joi.string().max(100).optional().allow(null, ''),
  role: Joi.string().valid('admin', 'employee').optional().allow(null, ''),
  department_id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().pattern(/^[0-9]+$/)).optional().allow(null, ''),
  status: Joi.string().valid('active', 'inactive', 'terminated', 'Active', 'Inactive', 'Terminated').optional().allow(null, ''),
  joined_date: Joi.string().optional().allow(null, ''),
  end_date: Joi.string().optional().allow(null, ''),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .optional()
    .allow(null, '')
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    })
}).unknown(true);

module.exports = {
  personalInfoSchema,
  updatePersonalInfoSchema,
  educationSchema,
  professionalSchema,
  workInfoSchema,
  documentSchema,
  updateDocumentsSchema
};
