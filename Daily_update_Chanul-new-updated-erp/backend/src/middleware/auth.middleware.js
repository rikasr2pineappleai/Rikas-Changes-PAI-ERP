// const jwt = require('jsonwebtoken');
// const { User } = require('../models');

// // Protect routes
// exports.protect = async (req, res, next) => {
//   // Add cache control headers to prevent caching of protected routes
//   res.set({
//     'Cache-Control': 'no-cache, no-store, must-revalidate',
//     'Pragma': 'no-cache',
//     'Expires': '0'
//   });

//   let token;

//   // Check for token in headers
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     try {
//       // Get token from header
//       token = req.headers.authorization.split(' ')[1];

//       // Verify token
//       const secret = process.env.JWT_SECRET || 'fallback_secret';
//       const decoded = jwt.verify(token, secret);

//       // Get user from token
//       req.user = await User.findByPk(decoded.id, {
//         attributes: { exclude: ['password_hash'] }
//       });

//       if (!req.user) {
//         return res.status(401).json({
//           success: false,
//           message: 'Not authorized, user not found'
//         });
//       }

//       next();
//     } catch (error) {
//       console.error('Authentication error:', error);
//       return res.status(401).json({
//         success: false,
//         message: 'Not authorized, token failed'
//       });
//     }
//   }

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: 'Not authorized, no token'
//     });
//   }
// };

// // Grant access to specific roles
// exports.authorize = (...roles) => {
//   return (req, res, next) => {
//     // Check if user is authenticated
//     if (!req.user) {
//       return res.status(403).json({
//         success: false,
//         message: 'User not authorized to access this route'
//       });
//     }
    
//     // Check if user's role is in the allowed roles
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'User not authorized to access this route'
//       });
//     }
    
//     next();
//   };
// };

const jwt = require('jsonwebtoken');
const { User, Role, UserRole } = require('../models');

// Protect routes
exports.protect = async (req, res, next) => {
  // Add cache control headers to prevent caching of protected routes
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header - more robust extraction
      const parts = req.headers.authorization.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, invalid authorization header format'
        });
      }
      
      token = parts[1];
      
      // Check if token exists and is not empty
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token missing in Bearer header'
        });
      }
      
      // Additional check for token validity (basic format check)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, invalid token format'
        });
      }
      
      // Verify token
      const secret = process.env.JWT_SECRET || 'fallback_secret';
      
      // Check if secret exists
      if (!secret || secret === 'fallback_secret') {
        console.warn('Warning: Using fallback JWT secret. Please set JWT_SECRET in environment variables.');
      }
      
      const decoded = jwt.verify(token, secret);

      // Get user from token - including roles
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password_hash'] },
        include: [{
          model: Role,
          through: { attributes: [] }, // Don't include the junction table attributes
          attributes: ['id', 'role_name']
        }]
      });

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Different error responses based on error type
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, invalid token format'
        });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired'
        });
      } else if (error.name === 'NotBeforeError') {
        return res.status(401).json({
          success: false,
          message: 'Token not yet valid'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token verification failed'
        });
      }
    }
  } else {
    // No token provided or doesn't start with 'Bearer'
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'User not authorized to access this route'
      });
    }
    
    // Check if user's simple role is in the allowed roles
    if (roles.includes(req.user.role)) {
      next();
      return;
    }
    
    try {
      // Check if user has any of the required roles through the UserRole relationship
      // If roles were loaded with the user, use them, otherwise fetch separately
      let userRoleNames = [];
      
      // The default association name for many-to-many relationship is usually 'Roles' or '<ModelName>s'
      // Check for the most common Sequelize association names
      if (req.user.Roles && req.user.Roles.length > 0) {
        // Roles were already loaded with the user using 'Roles' alias
        userRoleNames = req.user.Roles.map(role => role.role_name);
      } else if (req.user.roles && req.user.roles.length > 0) {
        // Roles were already loaded with the user using lowercase 'roles' alias
        userRoleNames = req.user.roles.map(role => role.role_name);
      } else {
        // Fetch roles separately
        const userRoles = await UserRole.findAll({
          where: { user_id: req.user.id },
          include: [{
            model: Role,
            attributes: ['role_name']
          }]
        });
        
        // Extract role names from the user roles
        userRoleNames = userRoles.map(ur => ur.Role ? ur.Role.role_name : null).filter(name => name !== null);
      }
      
      // Check if any of the user's roles match the required roles
      const hasRequiredRole = roles.some(requiredRole => 
        userRoleNames.includes(requiredRole)
      );
      
      if (hasRequiredRole) {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'User not authorized to access this route'
        });
      }
    } catch (error) {
      console.error('Role authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during role authorization'
      });
    }
  };
};
