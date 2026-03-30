// // config/database.js
// require('dotenv').config();

// module.exports = {
//   development: {
//     username: 'root',
//     password: '', // your MySQL password
//     database: 'pai_erp_dev',
//     host: '127.0.0.1',
//     dialect: 'mysql'
//   },
//   test: {
//     username: 'root',
//     password: '',
//     database: 'pai_erp_test',
//     host: '127.0.0.1',
//     dialect: 'mysql'
//   },
//   production: {
//     use_env_variable: 'DATABASE_URL', // For deployment (e.g., Render, Railway)
//     dialect: 'mysql',
//     dialectOptions: {
//       ssl: {
//         require: true,
//         rejectUnauthorized: false
//       }
//     }
//   }
// };


// config/database.js - Sequelize CLI Configuration
// This file now references the unified database configuration
// to maintain consistency between app runtime and migrations

require("dotenv").config();

// Determine environment
const env = process.env.NODE_ENV || 'development';

// Unified database configuration (same as src/config/db.js)
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

module.exports = dbConfig;

