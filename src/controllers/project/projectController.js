const projectService = require("../../services/project/projectService");

class ProjectController {
  /**
   * @desc    Create a new project
   * @route   POST /api/projects
   * @access  Private (scoped to active organization)
   */
  createProject = async (req, res, next) => {
    try {
      const project = await projectService.createProject(req.body);
      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get all projects with advanced filtering and pagination
   * @route   GET /api/projects
   * @access  Private (scoped to active organization)
   */
  getProjects = async (req, res, next) => {
    try {
      const result = await projectService.getProjects(req.query);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Update a project
   * @route   PUT /api/projects/:id
   * @access  Private (scoped to active organization)
   */
  updateProject = async (req, res, next) => {
    try {
      const project = await projectService.updateProject(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Delete a project
   * @route   DELETE /api/projects/:id
   * @access  Private (scoped to active organization)
   */
  deleteProject = async (req, res, next) => {
    try {
      await projectService.deleteProject(req.params.id);
      res.status(200).json({
        success: true,
        message: "Project deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ProjectController();
