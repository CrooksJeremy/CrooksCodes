/**
 * CONTACT ROUTES
 * 
 * Single endpoint for contact form submissions: POST /api/contact
 * Route is public (no admin token needed) but has security via rate limiting & validation
 * 
 * Middleware chain for POST /api/contact:
 * 1. contactRateLimiter → Check IP hasn't exceeded 5 requests in 15 minutes
 * 2. contactController.validateContact → Validate form fields (name, email, message)
 * 3. contactController.createContact → Insert into database if all above pass
 * 
 * If any step fails, request stops and error is returned
 */

const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const contactRateLimiter = require('../middleware/rateLimiter');

/**
 * POST /api/contact - Submit contact form
 * 
 * Middleware chain (order matters!):
 * 
 * 1. contactRateLimiter
 *    - Checks if IP has made > 5 requests in 15 minutes
 *    - If exceeded: Returns 429 Too Many Requests
 *    - If within limit: Increments counter and continues
 * 
 * 2. contactController.validateContact
 *    - Array of validation rules from express-validator
 *    - Checks: name (2-100 chars), email (valid format), message (10-1000 chars)
 *    - If invalid: Returns 400 Bad Request with error details
 *    - If valid: Continues
 * 
 * 3. contactController.createContact
 *    - Receives already-validated data
 *    - Inserts into database
 *    - Returns 201 Created with submitted contact
 * 
 * Only executed if previous middleware passed
 */
router.post('/', contactRateLimiter, contactController.validateContact, contactController.createContact);

// Export router for use in app.js
module.exports = router;