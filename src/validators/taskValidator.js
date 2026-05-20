const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");

/**
 * Helper to check valid Mongoose ObjectId format
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateCreateTask = async (req, res, next) => {
  try {
    const { title, priority, status, dueDate, projectId, assignedTo } = req.body;
    const orgId = req.organizationId;

    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, error: "Task title is required" });
    }

    if (priority && !["low", "medium", "high", "critical"].includes(priority)) {
      return res.status(400).json({ success: false, error: "Invalid priority value specified" });
    }

    if (status && !["backlog", "todo", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status value specified" });
    }

    if (dueDate && isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ success: false, error: "Invalid dueDate format. Use a valid date string." });
    }

    if (projectId) {
      if (!isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, error: "Invalid projectId format" });
      }
      // CRITICAL SEC: Verify project belongs to this organization
      const project = await Project.findOne({ _id: projectId, organizationId: orgId });
      if (!project) {
        return res.status(403).json({
          success: false,
          error: "Project does not exist in this organization scope (tenant isolation breach detected)",
        });
      }
    }

    if (assignedTo) {
      if (!isValidObjectId(assignedTo)) {
        return res.status(400).json({ success: false, error: "Invalid assignedTo format" });
      }
      // CRITICAL SEC: Verify user belongs to this organization
      const user = await User.findOne({ _id: assignedTo, organizationId: orgId });
      if (!user) {
        return res.status(403).json({
          success: false,
          error: "Assigned user does not belong to this organization scope (tenant isolation breach detected)",
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

const validateUpdateTask = async (req, res, next) => {
  try {
    const { title, priority, status, dueDate, projectId, assignedTo } = req.body;
    const orgId = req.organizationId;

    if (title !== undefined && title.trim() === "") {
      return res.status(400).json({ success: false, error: "Task title cannot be empty" });
    }

    if (priority && !["low", "medium", "high", "critical"].includes(priority)) {
      return res.status(400).json({ success: false, error: "Invalid priority value specified" });
    }

    if (status && !["backlog", "todo", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status value specified" });
    }

    if (dueDate && isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ success: false, error: "Invalid dueDate format. Use a valid date string." });
    }

    if (projectId) {
      if (!isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, error: "Invalid projectId format" });
      }
      // CRITICAL SEC: Verify project belongs to this organization
      const project = await Project.findOne({ _id: projectId, organizationId: orgId });
      if (!project) {
        return res.status(403).json({
          success: false,
          error: "Project does not exist in this organization scope (tenant isolation breach detected)",
        });
      }
    }

    if (assignedTo) {
      if (!isValidObjectId(assignedTo)) {
        return res.status(400).json({ success: false, error: "Invalid assignedTo format" });
      }
      // CRITICAL SEC: Verify user belongs to this organization
      const user = await User.findOne({ _id: assignedTo, organizationId: orgId });
      if (!user) {
        return res.status(403).json({
          success: false,
          error: "Assigned user does not belong to this organization scope (tenant isolation breach detected)",
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

const validateAssignTask = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const orgId = req.organizationId;

    if (userId) {
      if (!isValidObjectId(userId)) {
        return res.status(400).json({ success: false, error: "Invalid userId format for assignment" });
      }
      // CRITICAL SEC: Verify user belongs to this organization
      const user = await User.findOne({ _id: userId, organizationId: orgId });
      if (!user) {
        return res.status(403).json({
          success: false,
          error: "Assigned user does not belong to this organization scope (tenant isolation breach detected)",
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

const validateChangeStatus = (req, res, next) => {
  const { status } = req.body;

  if (!status || !["backlog", "todo", "in_progress", "completed"].includes(status)) {
    return res.status(400).json({
      success: false,
      error: "Status must be one of: backlog, todo, in_progress, completed",
    });
  }

  next();
};

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateAssignTask,
  validateChangeStatus,
};
