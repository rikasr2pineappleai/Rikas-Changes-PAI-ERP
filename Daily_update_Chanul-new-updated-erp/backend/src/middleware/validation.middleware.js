const { 
  loginSchema, 
  forgotPasswordSchema, 
  verifyOtpSchema, 
  resetPasswordSchema,
  changePasswordSchema
} = require('../validators/auth.validation');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    req.validatedData = value;
    next();
  };
};

module.exports = {
  validateLogin: validate(loginSchema),
  validateForgotPassword: validate(forgotPasswordSchema),
  validateVerifyOtp: validate(verifyOtpSchema),
  validateResetPassword: validate(resetPasswordSchema),
  validateChangePassword: validate(changePasswordSchema)
};