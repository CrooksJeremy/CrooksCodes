/**
 * ADMIN AUTHENTICATION MIDDLEWARE
 * 
 * Checks for valid admin token in Authorization header.
 * Used to protect POST, PUT, DELETE operations on projects.
 * 
 * Expected header format: Authorization: Bearer secret_admin_token
 * 
 * Flow:
 * 1. Extract token from Authorization header (remove 'Bearer ' prefix)
 * 2. Check if token exists and matches ADMIN_TOKEN from env
 * 3. If valid: call next() to proceed to route handler
 * 4. If invalid: return 401 Unauthorized, request stops
 */

const authMiddleware = (req, res, next) => {
  // Extract token from Authorization header
  // Expected format: "Bearer abc123def456"
  // ?.replace() uses optional chaining to avoid errors if header missing
  // This removes the "Bearer " prefix, leaving just the token
  const token = req.headers.authorization?.replace('Bearer ', '');

  // Check if token is missing OR doesn't match the expected admin token
  // process.env.ADMIN_TOKEN comes from .env file
  if (!token || token !== process.env.ADMIN_TOKEN) {
    // Token is invalid or missing - reject request
    // Return 401 (Unauthorized) HTTP status
    // Return immediately to stop request from continuing
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing admin token'
    });
  }

  // Token is valid - allow request to proceed
  // Call next() to pass control to the next middleware/route handler
  next();
};

module.exports = authMiddleware;