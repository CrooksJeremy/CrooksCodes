/**
 * RATE LIMITING MIDDLEWARE FOR CONTACT FORM
 * 
 * Prevents spam by limiting each IP address to 5 contact form submissions per 15 minutes.
 * Uses client IP address to track requests (127.0.0.1 for localhost).
 * 
 * Rate limit policy:
 * - Window: 15 minutes
 * - Max requests: 5 per IP per window
 * - Status code: 429 Too Many Requests (when limit exceeded)
 * 
 * Benefits:
 * - Prevents spam/abuse of contact form
 * - Protects backend from DoS attacks
 * - Allows legitimate users (5 per 15 min is plenty)
 */

const rateLimit = require('express-rate-limit');

// Create rate limiter with configuration
const contactRateLimiter = rateLimit({
  // Time window in milliseconds: 15 * 60 * 1000 = 15 minutes
  // Counter resets every 15 minutes
  windowMs: 15 * 60 * 1000,
  
  // Maximum number of requests allowed per IP per window
  // 6th request from same IP within 15 min will be rejected
  max: 5,
  
  // Custom response message sent when limit is exceeded
  // Formatted as JSON for consistency with other API responses
  message: {
    success: false,
    message: 'Too many contact requests from this IP, please try again later.'
  },
  
  // standardHeaders: true → Return rate limit info in RateLimit-* headers
  // Helps clients know when their limit resets
  standardHeaders: true,
  
  // legacyHeaders: false → Disable old X-RateLimit-* headers
  // Uses modern standard header format instead
  legacyHeaders: false,
});

// Export for use in contact route
module.exports = contactRateLimiter;