const taskService = require("../../services/task/taskService");

class TaskController {
  /**
   * @desc    Create a new task
   * @route   POST /api/tasks
   * @access  Private (scoped to active organization)
   */
  createTask = async (req, res, next) => {
    try {
      const task = await taskService.createTask(req.body);
      res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get all tasks with pagination and advanced filters
   * @route   GET /api/tasks
   * @access  Private (scoped to active organization)
   */
  getTasks = async (req, res, next) => {
    try {
      const result = await taskService.getTasks(req.query);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Update an existing task
   * @route   PUT /api/tasks/:id
   * @access  Private (scoped to active organization)
   */
  updateTask = async (req, res, next) => {
    try {
      const task = await taskService.updateTask(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Delete a task
   * @route   DELETE /api/tasks/:id
   * @access  Private (scoped to active organization)
   */
  deleteTask = async (req, res, next) => {
    try {
      await taskService.deleteTask(req.params.id);
      res.status(200).json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Assign a task explicitly to a user
   * @route   PUT /api/tasks/:id/assign
   * @access  Private (scoped to active organization)
   */
  assignTask = async (req, res, next) => {
    try {
      const { userId } = req.body;
      const task = await taskService.assignTask(req.params.id, userId);
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Change task status explicitly
   * @route   PUT /api/tasks/:id/status
   * @access  Private (scoped to active organization)
   */
  changeStatus = async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({
          success: false,
          error: "Status is required",
        });
      }

      const task = await taskService.changeStatus(req.params.id, status);
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new TaskController();
