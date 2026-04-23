const express = require('express');
const cors = require('cors');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const projectsRoutes = require('./routes/projects');
const contactRoutes = require('./routes/contact');

const app = express();

// Trust the first proxy hop. Required so express-rate-limit and
// req.ip see the real client address when deployed behind Render /
// Railway / Vercel / Cloudflare instead of the proxy's IP.
app.set('trust proxy', 1);

// CORS: open in local dev (when CORS_ORIGIN is unset), locked to
// a comma-separated whitelist in production (set CORS_ORIGIN on
// the host, e.g. "https://jeremycrooks.ca,https://www.jeremycrooks.ca").
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin
  ? { origin: corsOrigin.split(',').map((o) => o.trim()) }
  : {}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use('/api/projects', projectsRoutes);
app.use('/api/contact', contactRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 Not Found (must be last before error handler)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;