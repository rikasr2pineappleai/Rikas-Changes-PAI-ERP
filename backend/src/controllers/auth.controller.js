// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { User } = require('../models');
// const { Op } = require('sequelize');
// const nodemailer = require('nodemailer');

// // Create transporter for Gmail SMTP
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS
//   }
// });

// // Verify transporter configuration
// transporter.verify((error, success) => {
//   if (error) {
//     console.error('SMTP configuration error:', error);
//   } else {
//     console.log('SMTP server is ready to send emails');
//   }
// });

// // Generate JWT Token
// const generateToken = (userId) => {
//   return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', {
//     expiresIn: '7d'
//   });
// };

// // Hash password - this is the centralized password hashing function
// const hashPassword = async (password) => {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash(password, salt);
// };

// // Generate a random password - for employee management component to use
// const generateRandomPassword = (length = 8) => {
//   const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
//   let password = '';
//   for (let i = 0; i < length; i++) {
//     const randomIndex = Math.floor(Math.random() * charset.length);
//     password += charset[randomIndex];
//   }
//   return password;
// };

// // Generate a 6-digit OTP
// const generateOTP = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };

// // Send OTP via email
// const sendOTPEmail = async (email, otp) => {
//   const mailOptions = {
//     from: process.env.FROM_EMAIL,
//     to: email,
//     subject: 'PAI ERP Password Reset OTP',
//     text: `Your OTP for password reset is: ${otp}

// This OTP expires in 10 minutes.

// If you did not request this, please ignore this email.`,
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//         <h2>Password Reset OTP</h2>
//         <p>Your OTP for password reset is:</p>
//         <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
//         <p>This OTP expires in 10 minutes.</p>
//         <hr>
//         <p style="font-size: 12px; color: #666;">
//           If you did not request this password reset, please ignore this email.
//         </p>
//       </div>
//     `
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log(`OTP email sent successfully to ${email}`);
//     return true;
//   } catch (error) {
//     console.error('Error sending OTP email:', error);
//     return false;
//   }
// };

// // @desc    Login user
// // @route   POST /api/auth/login
// // @access  Public
// exports.login = async (req, res) => {
//   try {
//     const { identifier, password, rememberMe } = req.body;

//     // Validate input
//     if (!identifier || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide Employee ID/Email and password'
//       });
//     }

//     // Check for user by emp_id or email
//     const user = await User.findOne({
//       where: {
//         [Op.or]: [
//           { emp_id: identifier },
//           { email: identifier }
//         ]
//       },
//       include: [
//         {
//           model: require('../models').EmployeeDetail,
//           as: 'EmployeeDetail'
//         }
//       ]
//     });

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     }

//     // Check password
//     const isMatch = await bcrypt.compare(password, user.password_hash);

//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     }

//     // Generate token
//     const token = generateToken(user.id);
    
//     // Set expiration time based on rememberMe
//     const expiryTime = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7 days or 1 day

//     res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       token,
//       user: {
//         id: user.id,
//         emp_id: user.emp_id,
//         first_name: user.first_name,
//         last_name: user.last_name,
//         email: user.email,
//         role: user.role,
//         status: user.status,
//         profile_image: user.EmployeeDetail ? user.EmployeeDetail.image_path : null
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     // More specific error handling
//     if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeHostNotFoundError') {
//       return res.status(500).json({
//         success: false,
//         message: 'Database connection error. Please try again later.',
//         error: 'Database connection failed'
//       });
//     }
    
//     if (error.name === 'SequelizeDatabaseError') {
//       return res.status(500).json({
//         success: false,
//         message: 'Database error occurred. Please try again later.',
//         error: 'Database operation failed'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Server error during login',
//       error: error.message
//     });
//   }
// };

// // @desc    Forgot password
// // @route   POST /api/auth/forgot-password
// // @access  Public
// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     // Validate email
//     if (!email) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide email address'
//       });
//     }

//     // Check for user
//     const user = await User.findOne({
//       where: {
//         email: email
//       }
//     });

//     if (!user) {
//       // For security reasons, we don't reveal if email exists or not
//       return res.status(200).json({
//         success: true,
//         message: 'If email exists, OTP has been sent to your email'
//       });
//     }

//     // Generate OTP (6 digits)
//     const otp = generateOTP();
    
//     // Set expiration time (10 minutes from now)
//     const expires = new Date(Date.now() + 10 * 60 * 1000);
    
//     // Save OTP and expiration to user record
//     await user.update({
//       reset_otp: otp,
//       reset_otp_expires: expires
//     });
    
//     // Send OTP via email
//     const emailSent = await sendOTPEmail(email, otp);
    
//     if (!emailSent) {
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send OTP email. Please try again.'
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       message: 'OTP sent to your email'
//     });
//   } catch (error) {
//     console.error('Forgot password error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during forgot password process',
//       error: error.message
//     });
//   }
// };

// // @desc    Verify OTP
// // @route   POST /api/auth/verify-otp
// // @access  Public
// exports.verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     // Validate input
//     if (!email || !otp) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide email and OTP'
//       });
//     }

//     // Find user by email
//     const user = await User.findOne({
//       where: {
//         email: email
//       }
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid request'
//       });
//     }

//     // Check if OTP exists and is not expired
//     if (!user.reset_otp || !user.reset_otp_expires) {
//       return res.status(400).json({
//         success: false,
//         message: 'No OTP request found'
//       });
//     }

//     // Check if OTP is expired
//     if (user.reset_otp_expires < new Date()) {
//       return res.status(400).json({
//         success: false,
//         message: 'OTP has expired'
//       });
//     }

//     // Check if OTP matches
//     if (user.reset_otp !== otp) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid OTP'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: 'OTP verified successfully'
//     });
//   } catch (error) {
//     console.error('OTP verification error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during OTP verification',
//       error: error.message
//     });
//   }
// };

// // @desc    Reset password
// // @route   POST /api/auth/reset-password
// // @access  Public
// exports.resetPassword = async (req, res) => {
//   try {
//     const { email, otp, newPassword, confirmPassword } = req.body;

//     // Validate input
//     if (!email || !otp || !newPassword || !confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide all required fields'
//       });
//     }

//     // Check if passwords match
//     if (newPassword !== confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         message: 'Passwords do not match'
//       });
//     }

//     // Validate password strength
//     if (newPassword.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: 'Password must be at least 6 characters long'
//       });
//     }

//     // Find user by email
//     const user = await User.findOne({
//       where: {
//         email: email
//       }
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Check if OTP exists and is not expired
//     if (!user.reset_otp || !user.reset_otp_expires) {
//       return res.status(400).json({
//         success: false,
//         message: 'No OTP request found'
//       });
//     }

//     // Check if OTP is expired
//     if (user.reset_otp_expires < new Date()) {
//       return res.status(400).json({
//         success: false,
//         message: 'OTP has expired'
//       });
//     }

//     // Check if OTP matches
//     if (user.reset_otp !== otp) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid OTP'
//       });
//     }
    
//     // Check if new password is the same as current password
//     const isSameAsCurrent = await bcrypt.compare(newPassword, user.password_hash);
//     if (isSameAsCurrent) {
//       return res.status(400).json({
//         success: false,
//         message: 'New password cannot be the same as your current password'
//       });
//     }

//     // Hash new password using our centralized function
//     const hashedPassword = await hashPassword(newPassword);

//     // Update user password and clear OTP
//     await user.update({
//       password_hash: hashedPassword,
//       reset_otp: null,
//       reset_otp_expires: null
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Password reset successfully'
//     });
//   } catch (error) {
//     console.error('Password reset error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during password reset',
//       error: error.message
//     });
//   }
// };

// // @desc    Change password (protected)
// // @route   POST /api/auth/change-password
// // @access  Private
// exports.changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword, confirmPassword } = req.body;
//     const userId = req.user.id;

//     // Validate input
//     if (!currentPassword || !newPassword || !confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please provide all required fields'
//       });
//     }

//     // Check if passwords match
//     if (newPassword !== confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         message: 'New passwords do not match'
//       });
//     }

//     // Validate password strength
//     if (newPassword.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: 'New password must be at least 6 characters long'
//       });
//     }

//     // Get user
//     const user = await User.findByPk(userId);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Check current password
//     const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Current password is incorrect'
//       });
//     }
    
//     // Check if new password is the same as current password
//     const isSameAsCurrent = await bcrypt.compare(newPassword, user.password_hash);
//     if (isSameAsCurrent) {
//       return res.status(400).json({
//         success: false,
//         message: 'New password cannot be the same as your current password'
//       });
//     }

//     // Hash new password using our centralized function
//     const hashedPassword = await hashPassword(newPassword);

//     // Update user password
//     await user.update({
//       password_hash: hashedPassword
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Password changed successfully'
//     });
//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error during password change',
//       error: error.message
//     });
//   }
// };

// // @desc    Get current user
// // @route   GET /api/auth/me
// // @access  Private
// exports.getMe = async (req, res) => {
//   try {
//     const user = await User.findByPk(req.user.id, {
//       attributes: { exclude: ['password_hash', 'reset_otp', 'reset_otp_expires'] },
//       include: [
//         {
//           model: require('../models').EmployeeDetail,
//           as: 'EmployeeDetail'
//         }
//       ]
//     });

//     res.status(200).json({
//       success: true,
//       user: {
//         ...user.toJSON(),
//         profile_image: user.EmployeeDetail ? user.EmployeeDetail.image_path : null
//       }
//     });
//   } catch (error) {
//     console.error('Get me error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

// // Export utility functions for other components to use
// // This allows employee management and other components to securely hash passwords
// // without implementing their own password hashing logic
// exports.utils = {
//   hashPassword,
//   generateRandomPassword
// };

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

// Create transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP configuration error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '7d'
  });
};

// Hash password - this is the centralized password hashing function
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Generate a random password - for employee management component to use
const generateRandomPassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: 'PAI ERP Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}

This OTP expires in 10 minutes.

If you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset OTP</h2>
        <p>Your OTP for password reset is:</p>
        <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          If you did not request this password reset, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Use validated data from middleware instead of raw req.body
    const { identifier, password, rememberMe } = req.validatedData || req.body;

    // Check for user by emp_id or email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { emp_id: identifier },
          { email: identifier }
        ]
      },
      include: [
        {
          model: require('../models').EmployeeDetail,
          as: 'EmployeeDetail'
        }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user.id);
    
    // Set expiration time based on rememberMe
    const expiryTime = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 7 days or 1 day

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        emp_id: user.emp_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status,
        profile_image: user.EmployeeDetail ? user.EmployeeDetail.image_path : null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    // More specific error handling
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeHostNotFoundError') {
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.',
        error: 'Database connection failed'
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({
        success: false,
        message: 'Database error occurred. Please try again later.',
        error: 'Database operation failed'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    // Use validated data from middleware instead of raw req.body
    const { email } = req.validatedData || req.body;

    // Check for user
    const user = await User.findOne({
      where: {
        email: email
      }
    });

    if (!user) {
      // For security reasons, we don't reveal if email exists or not
      return res.status(200).json({
        success: true,
        message: 'If email exists, OTP has been sent to your email'
      });
    }

    // Generate OTP (6 digits)
    const otp = generateOTP();
    
    // Set expiration time (10 minutes from now)
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    
    // Save OTP and expiration to user record
    await user.update({
      reset_otp: otp,
      reset_otp_expires: expires
    });
    
    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otp);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during forgot password process',
      error: error.message
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
  try {
    // Use validated data from middleware instead of raw req.body
    const { email, otp } = req.validatedData || req.body;

    // Find user by email
    const user = await User.findOne({
      where: {
        email: email
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    // Check if OTP exists and is not expired
    if (!user.reset_otp || !user.reset_otp_expires) {
      return res.status(400).json({
        success: false,
        message: 'No OTP request found'
      });
    }

    // Check if OTP is expired
    if (user.reset_otp_expires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Check if OTP matches
    if (user.reset_otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Use validated data from middleware instead of raw req.body
    const { email, otp, newPassword, confirmPassword } = req.validatedData || req.body;

    // Find user by email
    const user = await User.findOne({
      where: {
        email: email
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP exists and is not expired
    if (!user.reset_otp || !user.reset_otp_expires) {
      return res.status(400).json({
        success: false,
        message: 'No OTP request found'
      });
    }

    // Check if OTP is expired
    if (user.reset_otp_expires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Check if OTP matches
    if (user.reset_otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // Check if new password is the same as current password
    const isSameAsCurrent = await bcrypt.compare(newPassword, user.password_hash);
    if (isSameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your current password'
      });
    }

    // Hash new password using our centralized function
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and clear OTP
    await user.update({
      password_hash: hashedPassword,
      reset_otp: null,
      reset_otp_expires: null
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
      error: error.message
    });
  }
};

// @desc    Change password (protected)
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    // Use validated data from middleware instead of raw req.body
    const { currentPassword, newPassword, confirmPassword } = req.validatedData || req.body;
    const userId = req.user.id;

    // Get user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Check if new password is the same as current password
    const isSameAsCurrent = await bcrypt.compare(newPassword, user.password_hash);
    if (isSameAsCurrent) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your current password'
      });
    }

    // Hash new password using our centralized function
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await user.update({
      password_hash: hashedPassword
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash', 'reset_otp', 'reset_otp_expires'] },
      include: [
        {
          model: require('../models').EmployeeDetail,
          as: 'EmployeeDetail'
        }
      ]
    });

    res.status(200).json({
      success: true,
      user: {
        ...user.toJSON(),
        profile_image: user.EmployeeDetail ? user.EmployeeDetail.image_path : null
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Export utility functions for other components to use
// This allows employee management and other components to securely hash passwords
// without implementing their own password hashing logic
exports.utils = {
  hashPassword,
  generateRandomPassword
};