/**
 * HTTP REQUEST LOGGING MIDDLEWARE
 * 
 * Uses Morgan library to log all HTTP requests.
 * Logs: timestamp, method, URL, status code, response size, referer, user agent.
 * 
 * Example log output:
 * 127.0.0.1 - - [21/Apr/2026:10:30:45 +0000] "POST /api/projects HTTP/1.1" 201 234 "-" "curl/7.64.1"
 * 
 * Format 'combined' includes: IP, timestamp, method, path, status, size, referer, user-agent
 */

const morgan = require('morgan');

// Create logger using 'combined' format
// Combined format is standard HTTP logging with all relevant details
const logger = morgan('combined');

// Export for use in app.js
// Added early in middleware stack to log all requests
module.exports = logger;