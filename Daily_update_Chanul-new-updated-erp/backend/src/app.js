// const express = require("express");
// const { QueryTypes } = require('sequelize');
// require("dotenv").config();

// const { sequelize } = require("./models");

// // Route files
// const authRoutes = require('./routes/auth.routes');
// const attendanceRoutes = require('./routes/attendance.routes');
// const sidebarRoutes = require('./routes/sidebar.routes');
// const employeeRoutes = require('./routes/employee.routes');

// // Leave Management Routes (from teammate's code)
// const leaveRoutes = require('./routes/leave.routes');
// const leavereqRoutes = require('./routes/leavereq.routes');
// const leaveBalanceRoutes = require('./routes/leavebalance.routes');

// // Rules & Regulations Routes (from teammate's code)
// const ruleCategoryRoutes = require('./routes/rulecategory.routes');
// const ruleRoutes = require('./routes/rule.routes');
// const roleRoutes = require('./routes/role.routes');

// const app = express();
// app.use(express.json());

// // Request logging middleware
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
//   next();
// });

// // Enhanced CORS for frontend
// app.use((req, res, next) => {
//   // For development, allow all origins
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-ID, X-User-Role, X-Employee-ID');
//   res.header('Access-Control-Allow-Credentials', true);

//   if (req.method === 'OPTIONS') {
//     res.sendStatus(200);
//   } else {
//     next();
//   }
// });

// // Serve static files from uploads directory
// app.use('/uploads', express.static('uploads'));

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('Unhandled error:', err);
//   res.status(500).json({
//     success: false,
//     message: 'Internal server error',
//     error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
//   });
// });

// // ✅ Sync DB (Safe Mode)
// // Disabled automatic sync to prevent 'too many keys' error
// // Models should be managed through migrations
// // sequelize.sync({ alter: false });

// // Mount routers
// app.use('/api/auth', authRoutes);
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api/sidebar', sidebarRoutes);
// app.use('/api/employees', employeeRoutes);

// // Leave Management Routes
// app.use('/api', leaveRoutes);
// app.use('/api', leavereqRoutes);
// app.use('/api/leave-balance', leaveBalanceRoutes);

// // Rules & Regulations Routes
// app.use('/api', ruleCategoryRoutes);
// app.use('/api', ruleRoutes);
// app.use('/roles', roleRoutes);

// // ✅ Test Route
// app.get("/", (req, res) => {
//   res.send("PAI ERP Backend Running ✅");
// });

// // ✅ Simple test route for sidebar
// app.get("/api/test-sidebar", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Sidebar route is working"
//   });
// });

// // ✅ Database Connection Test Route
// app.get("/api/test-db", async (req, res) => {
//   try {
//     // Test the database connection
//     await sequelize.authenticate();

//     // Get database name from the connection
//     const dbName = sequelize.config.database;

//     // Get list of tables
//     const tables = await sequelize.getQueryInterface().showAllSchemas();

//     // Get database version
//     let dbVersion = 'Unknown';
//     try {
//       const versionResult = await sequelize.query('SELECT VERSION() as version', { type: QueryTypes.SELECT });
//       if (versionResult && versionResult.length > 0) {
//         dbVersion = versionResult[0].version || 'Unknown';
//       }
//     } catch (versionError) {
//       console.log('Could not fetch database version:', versionError.message);
//     }

//     res.status(200).json({
//       message: "✅ Database connection successful!",
//       database: dbName,
//       version: process.env.PROJECT_VERSION || dbVersion, // Return PROJECT_VERSION from env, fallback to db version
//       connection: true,
//       tables: tables.length
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "❌ Database connection failed",
//       error: error.message,
//       connection: false
//     });
//   }
// });

// module.exports = app;

const express = require("express");
const { QueryTypes } = require("sequelize");
const path = require("path");
require("dotenv").config();

const { sequelize } = require("./models");

// Route files
const authRoutes = require("./routes/auth.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const sidebarRoutes = require("./routes/sidebar.routes");
const employeeRoutes = require("./routes/employee.routes");

// Leave Management Routes (from teammate's code)
const leaveRoutes = require("./routes/leave.routes");
const leavereqRoutes = require("./routes/leavereq.routes");
const leaveBalanceRoutes = require("./routes/leavebalance.routes");

// Rules & Regulations Routes (from teammate's code)
const ruleCategoryRoutes = require("./routes/rulecategory.routes");
const ruleRoutes = require("./routes/rule.routes");
const roleRoutes = require("./routes/role.routes");

// Department Routes
const departmentRoutes = require("./routes/department.routes");

// Letter/Template Routes
const letterRoutes = require("./routes/letter.routes");

const ratingRoutes = require("./routes/rating.routes");

//Project Routes
const projectRoutes = require("./routes/project.routes");
const taskRoutes = require("./routes/task.routes");

// User Routes
const userRoutes = require("./routes/user.routes");

const app = express();
app.use(express.json());

// Request logging middleware - only enable if needed for debugging
// Commented out to ensure no logging occurs
// if (process.env.LOG_REQUESTS === 'true') {
//   app.use((req, res, next) => {
//     console.log(
//       `${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`
//     );
//     next();
//   });
// }

// Enhanced CORS for both development and production
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Define allowed origins for both environments
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5000",
    "http://localhost:5001",
    "https://pai-erp-qa.pineappleai.cloud",
    "https://www.pai-erp-qa.pineappleai.cloud",
    "https://pai-erp-qa.pineappleai.cloud",
  ];

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    // Default to production domain if not in allowed list
    res.header(
      "Access-Control-Allow-Origin",
      "https://pai-erp-qa.pineappleai.cloud"
    );
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-ID, X-User-Role, X-Employee-ID"
  );
  res.header("Access-Control-Allow-Credentials", true);

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// CRITICAL: Serve static files from uploads directory with explicit priority
// This must come BEFORE any frontend serving middleware
const uploadsPath = path.join(__dirname, "uploads");

// Enhanced static file serving with proper headers for images
app.use("/uploads", express.static(uploadsPath, {
  maxAge: '7d',                    // Cache for 7 days
  etag: true,                      // Enable ETags for cache validation
  lastModified: true,              // Include Last-Modified header
  cacheControl: true,              // Explicitly enable Cache-Control
  immutable: true,                 // Files with hashes are immutable
  setHeaders: (res, path, stat) => {
    // Set proper cache headers for images
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || 
        path.endsWith('.png') || path.endsWith('.gif') || 
        path.endsWith('.webp') || path.endsWith('.jfif')) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // 7 days
      res.setHeader('Content-Type', getMimeType(path));
    }
  }
}));

// Helper function to get proper MIME types
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', 
    '.jfif': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// ✅ Sync DB (Safe Mode)
// Disabled automatic sync to prevent 'too many keys' error
// Models should be managed through migrations
// sequelize.sync({ alter: false });

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/sidebar", sidebarRoutes);
app.use("/api/employees", employeeRoutes);

// Leave Management Routes
app.use("/api", leaveRoutes);
app.use("/api", leavereqRoutes);
app.use("/api/leave-balance", leaveBalanceRoutes);

// Rules & Regulations Routes
app.use("/api", ruleCategoryRoutes);
app.use("/api", ruleRoutes);
app.use("/roles", roleRoutes);

// Letter/Template Routes
app.use("/api/templates", letterRoutes);

// Department Routes
app.use("/api/departments", departmentRoutes);

app.use("/api/ratings", ratingRoutes);

// Project Routes
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

// User Routes
app.use("/api/users", userRoutes);

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("PAI ERP Backend Running ✅");
});



// ✅ Simple test route for sidebar
app.get("/api/test-sidebar", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Sidebar route is working",
  });
});

// ✅ Database Connection Test Route
app.get("/api/test-db", async (req, res) => {
  try {
    // Test the database connection
    await sequelize.authenticate();

    // Get database name from the connection
    const dbName = sequelize.config.database;

    // Get list of tables
    const tables = await sequelize.getQueryInterface().showAllSchemas();

    // Get database version
    let dbVersion = "Unknown";
    try {
      const versionResult = await sequelize.query(
        "SELECT VERSION() as version",
        { type: QueryTypes.SELECT }
      );
      if (versionResult && versionResult.length > 0) {
        dbVersion = versionResult[0].version || "Unknown";
      }
    } catch (versionError) {
      console.log("Could not fetch database version:", versionError.message);
    }

    res.status(200).json({
      message: "✅ Database connection successful!",
      database: dbName,
      version: process.env.PROJECT_VERSION || dbVersion, // Return PROJECT_VERSION from env, fallback to db version
      connection: true,
      tables: tables.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Database connection failed",
      error: error.message,
      connection: false,
    });
  }
});

// Error handling middleware - MUST be after all routes
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  
  // Return JSON response for all errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

module.exports = app;