const mongoose = require("mongoose");

/**
 * Helper to check valid Mongoose ObjectId format
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateCreateTask = (req, res, next) => {
  const { title, priority, status, dueDate, projectId, assignedTo } = req.body;

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

  if (projectId && !isValidObjectId(projectId)) {
    return res.status(400).json({ success: false, error: "Invalid projectId format" });
  }

  if (assignedTo && !isValidObjectId(assignedTo)) {
    return res.status(400).json({ success: false, error: "Invalid assignedTo format" });
  }

  next();
};

const validateUpdateTask = (req, res, next) => {
  const { title, priority, status, dueDate, projectId, assignedTo } = req.body;

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

  if (projectId && !isValidObjectId(projectId)) {
    return res.status(400).json({ success: false, error: "Invalid projectId format" });
  }

  if (assignedTo && !isValidObjectId(assignedTo)) {
    return res.status(400).json({ success: false, error: "Invalid assignedTo format" });
  }

  next();
};

const validateAssignTask = (req, res, next) => {
  const { userId } = req.body;

  if (userId && !isValidObjectId(userId)) {
    return res.status(400).json({ success: false, error: "Invalid userId format for assignment" });
  }

  next();
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
