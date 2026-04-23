/**
 * PROJECTS ROUTES
 * 
 * All routes are prefixed with /api/projects (mounted in app.js)
 * 
 * Public Routes (no authentication needed):
 * - GET /api/projects → Get all projects
 * - GET /api/projects/:id → Get single project by ID
 * 
 * Protected Routes (require admin token in Authorization header):
 * - POST /api/projects → Create new project
 * - PUT /api/projects/:id → Update existing project
 * - DELETE /api/projects/:id → Delete project
 * 
 * Security: authMiddleware checks admin token before protected routes execute
 */

const express = require('express');
const router = express.Router();
const projectsController = require('../controllers/projectsController');
const authMiddleware = require('../middleware/auth');

/**
 * PUBLIC ROUTES - No authentication required
 * GET requests are safe (read-only) so no auth needed
 */

// GET /api/projects
// Fetch all projects from database
router.get('/', projectsController.getAllProjects);

// GET /api/projects/:id
// Fetch single project by UUID
// :id is a URL parameter (e.g., /api/projects/abc-123 → req.params.id = 'abc-123')
router.get('/:id', projectsController.getProjectById);

/**
 * PROTECTED ROUTES - Require admin token
 * POST, PUT, DELETE operations modify data so need authentication
 * authMiddleware checks Authorization header before reaching controller
 */

// POST /api/projects
// Create new project (admin only)
// Middleware chain: authMiddleware → projectsController.createProject
router.post('/', authMiddleware, projectsController.createProject);

// PUT /api/projects/:id
// Update existing project (admin only)
// :id identifies which project to update
router.put('/:id', authMiddleware, projectsController.updateProject);

// DELETE /api/projects/:id
// Delete project (admin only)
// :id identifies which project to delete
router.delete('/:id', authMiddleware, projectsController.deleteProject);

// Export router for use in app.js
module.exports = router;