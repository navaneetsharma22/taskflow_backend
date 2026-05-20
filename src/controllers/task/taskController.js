const taskService = require("../../services/task/taskService");

class TaskController {
  /**
   * @desc    Create a new task
   * @route   POST /api/tasks
   * @access  Private (scoped to active organization)
   */
  createTask = async (req, res, next) => {
    try {
      const task = await taskService.createTask(req.body, req.user.id);
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
      const task = await taskService.updateTask(req.params.id, req.body, req.user);
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
      await taskService.deleteTask(req.params.id, req.user);
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
      const task = await taskService.assignTask(req.params.id, userId, req.user);
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

      const task = await taskService.changeStatus(req.params.id, status, req.user);
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  };
  /**
   * @desc    Get comments for a task
   * @route   GET /api/tasks/:id/comments
   * @access  Private
   */
  getComments = async (req, res, next) => {
    try {
      const comments = await require("../../models/Comment")
        .find({ taskId: req.params.id })
        .populate("userId", "name email role")
        .sort("createdAt");
      res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Create a comment on a task
   * @route   POST /api/tasks/:id/comments
   * @access  Private
   */
  createComment = async (req, res, next) => {
    try {
      const { content } = req.body;
      if (!content || content.trim() === "") {
        return res.status(400).json({ success: false, error: "Comment content is required" });
      }

      const task = await require("../../models/Task").findById(req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, error: "Task not found" });
      }

      const comment = await require("../../models/Comment").create({
        taskId: req.params.id,
        userId: req.user.id,
        content,
      });

      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get attachments for a task
   * @route   GET /api/tasks/:id/attachments
   * @access  Private
   */
  getAttachments = async (req, res, next) => {
    try {
      const attachments = await require("../../models/Attachment")
        .find({ taskId: req.params.id })
        .populate("userId", "name email role")
        .sort("-createdAt");
      res.status(200).json({
        success: true,
        data: attachments,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Create an attachment on a task
   * @route   POST /api/tasks/:id/attachments
   * @access  Private
   */
  createAttachment = async (req, res, next) => {
    try {
      const { fileName, fileUrl, fileType, fileSize } = req.body;
      if (!fileName || !fileUrl) {
        return res.status(400).json({ success: false, error: "fileName and fileUrl are required" });
      }

      const task = await require("../../models/Task").findById(req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, error: "Task not found" });
      }

      const attachment = await require("../../models/Attachment").create({
        taskId: req.params.id,
        userId: req.user.id,
        fileName,
        fileUrl,
        fileType,
        fileSize,
      });

      res.status(201).json({
        success: true,
        data: attachment,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new TaskController();
