/**
 * CONTACT CONTROLLER
 * 
 * Handles contact form submission and validation.
 * 
 * Key features:
 * - Validates contact form input (name, email, message)
 * - Inserts valid submissions into database
 * - Returns validation errors with details
 * - Called after rate limiting (prevents spam)
 * 
 * Flow:
 * 1. validateContact middleware runs validation rules
 * 2. createContact checks for validation errors
 * 3. If errors: returns 400 with error details (database not touched)
 * 4. If valid: inserts into database and returns 201
 */

const { body, validationResult, matchedData } = require('express-validator');
const contactService = require('../services/contactService');
const { sendContactNotification } = require('../services/emailService');

class ContactController {
  /**
   * VALIDATION RULES - Applied before createContact is called
   * 
   * Each rule checks a field and specifies valid format:
   * - .trim() removes whitespace from edges
   * - .isLength({ min, max }) checks character count
   * - .isEmail() validates email format
   * - .normalizeEmail() converts to standard format (lowercase)
   * - .withMessage('error') custom error message if validation fails
   * 
   * Validation errors are caught and returned as 400 Bad Request
   * Prevents invalid data from reaching database
   */
  validateContact = [
    // Validate name field
    body('name')
      .trim()  // Remove whitespace from start/end ("  John  " → "John")
      .isLength({ min: 2, max: 100 })  // Must be 2-100 characters
      .withMessage('Name must be between 2 and 100 characters'),
    
    // Validate email field
    body('email')
      .isEmail()  // Must be valid email format
      .normalizeEmail()  // Convert to standard format
      .withMessage('Please provide a valid email'),
    
    // Validate message field
    body('message')
      .trim()  // Remove whitespace
      .isLength({ min: 10, max: 1000 })  // Must be 10-1000 characters
      .withMessage('Message must be between 10 and 1000 characters')
  ];

  /**
   * POST /api/contact - Submit contact form (PUBLIC)
   * 
   * Called after:
   * 1. Rate limiter checks (5 per 15 min per IP)
   * 2. Validation rules are applied
   * 
   * This method checks if validation passed
   * If failed: Return 400 with error details
   * If passed: Insert into database and return 201
   */
  async createContact(req, res, next) {
    try {
      // Get validation results from express-validator
      // validationResult() checks if any validation rules failed
      const errors = validationResult(req);
      
      // Check if validation found any errors
      if (!errors.isEmpty()) {
        // Validation failed - return 400 Bad Request
        // Include array of all validation errors found
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()  // Array with field names and error messages
        });
        // Return here prevents rest of function executing
      }

      const { name, email, message } = matchedData(req);

      const contactData = {
        name,
        email,
        message,
        created_at: new Date().toISOString()
      };

      // Call service to insert contact into database
      const newContact = await contactService.createContact(contactData);

      // Fire-and-forget email notification. If sending fails for any
      // reason (Resend down, bad API key, etc.) the submission still
      // succeeds — the row is already saved in Supabase.
      sendContactNotification(newContact).catch((err) => {
        console.error('CONTACT EMAIL DISPATCH ERROR:', err);
      });

      // Return 201 Created with success message and submitted contact
      res.status(201).json({
        success: true,
        message: 'Contact submitted successfully',
        data: newContact  // Includes auto-generated id and timestamp
      });
    } catch (error) {
      // If any error occurs, pass to error handler
      next(error);
    }
  }
}

// Export singleton instance
module.exports = new ContactController();