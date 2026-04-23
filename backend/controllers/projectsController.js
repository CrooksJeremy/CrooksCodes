/**
 * PROJECTS CONTROLLER
 * 
 * Handles all request/response logic for project-related endpoints.
 * Orchestrates between HTTP layer (Express) and database layer (Services).
 * 
 * Responsibilities:
 * - Extract data from request (params, body, headers)
 * - Validate input if not delegated to middleware
 * - Call service methods to interact with database
 * - Handle errors with try/catch
 * - Format responses as JSON
 * - Set appropriate HTTP status codes
 * 
 * Does NOT know about:
 * - Database queries (that's the service)
 * - How Supabase works
 * - Authentication details
 * 
 * Each method handles one endpoint:
 * - GET / → getAllProjects
 * - GET /:id → getProjectById
 * - POST / → createProject
 * - PUT /:id → updateProject
 * - DELETE /:id → deleteProject
 */

const projectsService = require('../services/projectsService');

class ProjectsController {
  /**
   * GET /api/projects - Fetch all projects
   * 
   * No parameters needed
   * Response: Array of all projects, ordered by newest first
   * Status: 200 OK
   */
  async getAllProjects(req, res, next) {
    try {
      // Call service to fetch all projects from database
      const projects = await projectsService.getAllProjects();
      
      // Return successful response with projects array
      // res.json() automatically sets status 200 if not specified
      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      // If service throws error, pass to error handler
      // Error handler formats and sends error response
      next(error);
    }
  }

  /**
   * GET /api/projects/:id - Fetch single project
   * 
   * URL Parameter: id (project UUID from URL)
   * Response: Single project object or error if not found
   * Status: 200 OK or 400 if not found
   */
  async getProjectById(req, res, next) {
    try {
      // Extract project ID from URL parameters
      // Example: GET /api/projects/abc-123 → req.params.id = 'abc-123'
      const { id } = req.params;
      
      // Call service to fetch single project by ID
      const project = await projectsService.getProjectById(id);
      
      // Return successful response with single project
      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects - Create new project (ADMIN ONLY)
   * 
   * Request Body: { title, description, techStack[], githubLink, liveDemoLink, image }
   * Response: Created project object with auto-generated id and created_at
   * Status: 201 Created
   * Auth: Requires admin token (checked by authMiddleware before reaching this)
   */
  async createProject(req, res, next) {
  try {
    // Get project data from request body (already parsed by express.json())
    const projectData = req.body;
    
    // Call service to insert new project into database
    // Service handles the Supabase query
    const newProject = await projectsService.createProject(projectData);
    
    // Return 201 Created (standard HTTP status for successful POST)
    // Include created project with generated ID and timestamp
    res.status(201).json({
      success: true,
      data: newProject
    });
  } catch (error) {
    next(error);
  }
}
  /**
   * PUT /api/projects/:id - Update existing project (ADMIN ONLY)
   * 
   * URL Parameter: id (project UUID)
   * Request Body: { fields to update } (only provided fields are updated)
   * Response: Updated project object
   * Status: 200 OK
   * Auth: Requires admin token
   */
  async updateProject(req, res, next) {
    try {
      // Extract project ID from URL
      const { id } = req.params;
      
      // Get updated data from request body
      const projectData = req.body;
      
      // Call service to update project in database
      const updatedProject = await projectsService.updateProject(id, projectData);
      
      // Return 200 OK with updated project
      res.json({
        success: true,
        data: updatedProject
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/projects/:id - Delete project (ADMIN ONLY)
   * 
   * URL Parameter: id (project UUID)
   * Response: Success message (no data to return)
   * Status: 200 OK
   * Auth: Requires admin token
   */
  async deleteProject(req, res, next) {
    try {
      // Extract project ID from URL
      const { id } = req.params;
      
      // Call service to delete project from database
      await projectsService.deleteProject(id);
      
      // Return 200 OK with success message
      // No data to return (project is deleted)
      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
// All requests share same instance (efficient, consistent state)
module.exports = new ProjectsController();