const Joi = require('joi');

// Login validation schema
const loginSchema = Joi.object({
  identifier: Joi.string()
    .min(3)
    .max(50)
    .required()
    .custom((value, helpers) => {
      // Check if it's a valid email format
      if (value.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return helpers.error('string.email');
        }
        return value;
      }
      // Otherwise, check if it's a valid employee ID format
      else {
        const empIdRegex = /^[A-Za-z0-9._-]+$/;
        if (!empIdRegex.test(value)) {
          return helpers.error('string.pattern.base');
        }
        return value;
      }
    })
    .messages({
      'string.pattern.base': 'Employee ID can only contain letters, numbers, dots, underscores, and hyphens',
      'string.email': 'Please provide a valid email address',
      'string.min': 'Identifier must be at least 3 characters long',
      'string.max': 'Identifier cannot exceed 50 characters'
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters'
    }),
  rememberMe: Joi.boolean()
    .optional()
    .default(false)
});

// Forgot password validation schema
const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address'
    })
});

// Verify OTP validation schema
const verifyOtpSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only numbers'
    })
});

// Reset password validation schema
const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required(),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
  confirmPassword: Joi.ref('newPassword')
});

// Change password validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .min(6)
    .max(128)
    .required(),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
  confirmPassword: Joi.ref('newPassword')
});

module.exports = {
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  changePasswordSchema
};