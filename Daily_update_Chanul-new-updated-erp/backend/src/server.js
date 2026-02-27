// const app = require("./app");   // ✅ CORRECT PATH
// const { connectDB } = require("./config/db");

// const PORT = process.env.PORT || 5001;

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   console.error('Uncaught Exception:', err);
//   console.error('Stack:', err.stack);
//   // Don't exit, just log the error
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   // Log the full error details
//   console.error('Full error details:', reason);
//   // Don't exit, just log the error
//   // process.exit(1); // Removed to prevent termination
// });

// // ✅ Connect Database First
// connectDB().then(() => {
//   const server = app.listen(PORT, '0.0.0.0', () => {
//     console.log(`🚀 PAI ERP Server running on port ${PORT}`);
//   });

//   // Handle graceful shutdown
//   const shutdown = () => {
//     console.log('Shutting down gracefully...');
//     server.close(() => {
//       console.log('Process terminated');
//     });
//   };

//   process.on('SIGTERM', shutdown);
//   process.on('SIGINT', shutdown);

// }).catch((error) => {
//   console.error("❌ Failed to start server due to database connection issue:", error.message);
//   console.log("Please check your database configuration and ensure MySQL is running.");
//   // Remove process.exit(1) to prevent forced termination
//   // This allows the process to stay alive so we can see what's happening
// });


const app = require("./app");   // ✅ CORRECT PATH
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 5001;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  // Don't exit, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log the full error details
  console.error('Full error details:', reason);
  // Don't exit, just log the error
  // process.exit(1); // Removed to prevent termination
});

// ✅ Connect Database First
connectDB().then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PAI ERP Server running on port ${PORT}`);
  });

  // Handle graceful shutdown
  const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

}).catch((error) => {
  console.error("❌ Failed to start server due to database connection issue:", error.message);
  console.log("Please check your database configuration and ensure MySQL is running.");
  // Remove process.exit(1) to prevent forced termination
  // This allows the process to stay alive so we can see what's happening
});