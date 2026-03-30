// const { Sequelize } = require("sequelize");
// require("dotenv").config(); // Load .env variables

// // ✅ Create Sequelize Instance
// const sequelize = new Sequelize(
//   process.env.DB_NAME || "pai_erp_dev",   // Default to pai_erp_dev
//   process.env.DB_USER || "root",          // Default to root
//   process.env.DB_PASS || "",              // Default to empty password
//   {
//     host: process.env.DB_HOST || "127.0.0.1",
//     port: process.env.DB_PORT || 3306,
//     dialect: "mysql",    // ✅ Works for both MySQL & MariaDB
//     logging: false,
//     pool: {
//       max: 20,           // Increased max connections
//       min: 0,
//       acquire: 60000,    // Increased acquire timeout
//       idle: 10000,
//       evict: 10000,      // Evict idle connections
//     },
//     timezone: "+05:30",  // Sri Lanka timezone (optional but recommended)
//     retry: {
//       max: 3             // Retry failed queries up to 3 times
//     }
//   }
// );

// // ✅ Database Connection Test
// const connectDB = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("✅ PAI ERP Database connected successfully!");
//   } catch (error) {
//     console.error("❌ Database connection failed:", error.message);
//     console.error("Error details:", {
//       code: error.original ? error.original.code : 'N/A',
//       errno: error.original ? error.original.errno : 'N/A',
//       syscall: error.original ? error.original.syscall : 'N/A',
//       hostname: error.original ? error.original.hostname : 'N/A'
//     });
    
//     // Instead of exiting, throw the error so it can be handled by the caller
//     throw error;
//   }
// };

// module.exports = {
//   sequelize,
//   connectDB,
// };

const { Sequelize } = require("sequelize");
require("dotenv").config(); // Load .env variables

// Determine environment
const env = process.env.NODE_ENV || "development";

// Database configuration based on environment
const dbConfig = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false, // Disable SQL logging for cleaner console
    pool: {
      max: 20, // Increased max connections
      min: 0,
      acquire: 60000, // Increased acquire timeout
      idle: 10000,
      evict: 10000, // Evict idle connections
    },
    timezone: "+05:30", // Sri Lanka timezone
    retry: {
      max: 3, // Retry failed queries up to 3 times
    },
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME_TEST || process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 20, // Increased max connections
      min: 2,
      acquire: 60000, // Increased acquire timeout
      idle: 10000,
      evict: 10000, // Evict idle connections
    },
    timezone: "+05:30", // Sri Lanka timezone
    retry: {
      max: 3, // Retry failed queries up to 3 times
    },
  },
};

// Get current environment config
const config = dbConfig[env];

// ✅ Create Sequelize Instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// ✅ Database Connection Test
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PAI ERP Database connected successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Error details:", {
      code: error.original ? error.original.code : "N/A",
      errno: error.original ? error.original.errno : "N/A",
      syscall: error.original ? error.original.syscall : "N/A",
      hostname: error.original ? error.original.hostname : "N/A",
    });

    // Instead of exiting, throw the error so it can be handled by the caller
    throw error;
  }
};

module.exports = {
  sequelize,
  connectDB,
};
