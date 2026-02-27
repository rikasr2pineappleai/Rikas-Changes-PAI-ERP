// Shared error handler function
const handleControllerError = (error, operation) => {
  console.error(`${operation} error:`, error);
  return {
    success: false,
    message: `Server error during ${operation}`,
    error: process.env.NODE_ENV === "development"
      ? error.message
      : "Something went wrong",
  };
};

module.exports = { handleControllerError };