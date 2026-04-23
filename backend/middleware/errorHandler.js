/**
 * CENTRAL ERROR HANDLER MIDDLEWARE
 * 
 * Catches and formats all errors from the entire application.
 * Must be placed LAST in middleware stack (after all routes).
 * 
 * Express recognizes error handlers by the 4-parameter signature: (err, req, res, next)
 * When next(error) is called anywhere, this handler catches it.
 * 
 * Error types handled:
 * 1. Database errors (Supabase) - 400 Bad Request
 * 2. Validation errors (express-validator) - 400 Bad Request
 * 3. All other errors - 500 Internal Server Error
 */

const errorHandler = (err, req, res, next) => {
  // Log error details to console for debugging
  // err.stack includes file name and line number where error occurred
  console.error(err.stack);

  // Check if error is from Supabase (has 'code' property)
  // Database errors have a code property indicating what went wrong
  if (err.code) {
    return res.status(400).json({
      success: false,
      message: 'Database error',
      error: err.message
    });
  }

  // Check if error is from express-validator (has 'array' method)
  // Validation errors are arrays of field validation failures
  if (err.array) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.array()  // Array of validation errors with details
    });
  }

  // Default error handler for any unspecified error
  // Returns 500 (Internal Server Error)
  // In development: shows actual error message for debugging
  // In production: shows generic message for security (don't leak details)
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    // Only show error message in development, hide in production
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = errorHandler;