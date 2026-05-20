const automationEngine = require("../../ai/automationEngine");
const Task = require("../../models/Task");
const Comment = require("../../models/Comment");
const AiHistory = require("../../models/AiHistory");

class AiController {
  /**
   * @desc    Suggest subtasks/breakdown for a task
   * @route   POST /api/ai/breakdown
   * @access  Private
   */
  getTaskBreakdown = async (req, res, next) => {
    try {
      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, error: "Task title is required" });
      }

      const breakdown = await automationEngine.getTaskBreakdown(req.user.id, title, description);
      res.status(200).json({ success: true, data: breakdown });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Detect appropriate task priority
   * @route   POST /api/ai/priority
   * @access  Private
   */
  detectPriority = async (req, res, next) => {
    try {
      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, error: "Task title is required" });
      }

      const prioritySuggestion = await automationEngine.detectPriority(req.user.id, title, description);
      res.status(200).json({ success: true, data: prioritySuggestion });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Generate milestones/phases for a project
   * @route   POST /api/ai/roadmap
   * @access  Private
   */
  generateProjectRoadmap = async (req, res, next) => {
    try {
      const { title, description } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, error: "Project title is required" });
      }

      const roadmap = await automationEngine.generateProjectRoadmap(req.user.id, title, description);
      res.status(200).json({ success: true, data: roadmap });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Generate executive summary of a task and its comments
   * @route   POST /api/ai/summary
   * @access  Private
   */
  getTaskSummary = async (req, res, next) => {
    try {
      const { taskId } = req.body;
      if (!taskId) {
        return res.status(400).json({ success: false, error: "taskId is required" });
      }

      // Fetch task (automatically isolated by tenant context)
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ success: false, error: "Task not found" });
      }

      // Fetch all comments of this task (populated with author details)
      const comments = await Comment.find({ taskId }).populate("userId", "name");

      const summary = await automationEngine.getTaskSummary(
        req.user.id,
        task.title,
        task.description,
        comments
      );

      res.status(200).json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get tenant AI operations audit history
   * @route   GET /api/ai/history
   * @access  Private
   */
  getAiHistory = async (req, res, next) => {
    try {
      const history = await AiHistory.find()
        .populate("userId", "name email")
        .sort("-createdAt")
        .limit(100);

      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AiController();
