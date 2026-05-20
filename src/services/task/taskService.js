const Task = require("../../models/Task");
const User = require("../../models/User");
const Project = require("../../models/Project");
const { broadcastToOrg, emitToUser } = require("../../sockets/socketServer");
const webhookService = require("../webhookService");

class TaskService {
  /**
   * Create a new task within the organization
   */
  async createTask(taskData) {
    // If assignedTo is provided, verify user exists in the active organization context
    if (taskData.assignedTo) {
      const userExists = await User.findById(taskData.assignedTo);
      if (!userExists) {
        const error = new Error("Assigned user does not exist in this organization");
        error.statusCode = 404;
        throw error;
      }
    }

    // If projectId is provided, verify project exists in the active organization context
    if (taskData.projectId) {
      const projectExists = await Project.findById(taskData.projectId);
      if (!projectExists) {
        const error = new Error("Project does not exist in this organization");
        error.statusCode = 404;
        throw error;
      }
    }

    // Create the task (organizationId is automatically set by the tenant plugin)
    const task = await Task.create(taskData);

    // Real-time Event: Broadcast task creation inside organization room
    broadcastToOrg(task.organizationId, "task_created", task);

    // Webhook Trigger: Notify organization's webhooks
    webhookService.trigger(task.organizationId, "task.created", task);

    // Real-time Event: Send a live notification specifically to the assigned user
    if (task.assignedTo) {
      emitToUser(task.organizationId, task.assignedTo, "live_notification", {
        type: "task_assigned",
        message: `You have been assigned to task: "${task.title}"`,
        data: task,
      });
    }

    return task;
  }

  /**
   * Get all tasks of the organization with advanced filtering and pagination
   */
  async getTasks(queryParams) {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      status,
      priority,
      assignedTo,
      projectId,
      search,
    } = queryParams;

    // Build query conditions
    const queryConditions = {};

    if (status) {
      queryConditions.status = status;
    }

    if (priority) {
      queryConditions.priority = priority;
    }

    if (assignedTo) {
      queryConditions.assignedTo = assignedTo;
    }

    if (projectId) {
      queryConditions.projectId = projectId;
    }

    if (search) {
      // Regex search on title or description
      queryConditions.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination calculations
    const skipCount = (parseInt(page) - 1) * parseInt(limit);

    // Run query (multi-tenant filtering is automatically applied)
    const tasksQuery = Task.find(queryConditions)
      .populate("assignedTo", "name email role")
      .populate("projectId", "name status")
      .sort(sort)
      .skip(skipCount)
      .limit(parseInt(limit));

    const totalDocs = await Task.countDocuments(queryConditions);
    const tasks = await tasksQuery;

    return {
      tasks,
      pagination: {
        total: totalDocs,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalDocs / parseInt(limit)),
      },
    };
  }

  /**
   * Update a task's full properties
   */
  async updateTask(taskId, updateData) {
    // Validate referenced project if updating it
    if (updateData.projectId) {
      const projectExists = await Project.findById(updateData.projectId);
      if (!projectExists) {
        const error = new Error("Project does not exist in this organization");
        error.statusCode = 404;
        throw error;
      }
    }

    // Validate assigned user if updating it
    if (updateData.assignedTo) {
      const userExists = await User.findById(updateData.assignedTo);
      if (!userExists) {
        const error = new Error("Assigned user does not exist in this organization");
        error.statusCode = 404;
        throw error;
      }
    }

    // Update task (automatically scoped to current organization)
    const task = await Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    // Real-time Event: Broadcast task update inside organization room
    broadcastToOrg(task.organizationId, "task_updated", task);

    // Webhook Trigger: Notify organization's webhooks
    webhookService.trigger(task.organizationId, "task.updated", task);

    // Real-time Event: Send a live notification specifically to the new assignee if changed
    if (updateData.assignedTo) {
      emitToUser(task.organizationId, updateData.assignedTo, "live_notification", {
        type: "task_assigned",
        message: `You have been assigned to task: "${task.title}"`,
        data: task,
      });
    }

    return task;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId) {
    // Scoped deletion (automatically filtered)
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    // Real-time Event: Broadcast task deletion inside organization room
    broadcastToOrg(task.organizationId, "task_deleted", { taskId });

    // Webhook Trigger: Notify organization's webhooks
    webhookService.trigger(task.organizationId, "task.deleted", { taskId });

    return task;
  }

  /**
   * Explicitly assign a task to a user
   */
  async assignTask(taskId, userId) {
    let user = null;
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        const error = new Error("User does not exist in this organization");
        error.statusCode = 404;
        throw error;
      }
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      { assignedTo: userId || null },
      { new: true, runValidators: true }
    );

    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    // Real-time Event: Broadcast task update
    broadcastToOrg(task.organizationId, "task_updated", task);

    // Real-time Event: Send a live notification specifically to the assigned user
    if (userId) {
      emitToUser(task.organizationId, userId, "live_notification", {
        type: "task_assigned",
        message: `You have been assigned to task: "${task.title}"`,
        data: task,
      });
    }

    return task;
  }

  /**
   * Explicitly change the status of a task
   */
  async changeStatus(taskId, status) {
    const validStatuses = ["backlog", "todo", "in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
      error.statusCode = 400;
      throw error;
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true, runValidators: true }
    );

    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    // Real-time Event: Broadcast task update (including the status transition)
    broadcastToOrg(task.organizationId, "task_updated", task);

    // Real-time Event: Send a live notification to assignee that their task status has changed
    if (task.assignedTo) {
      emitToUser(task.organizationId, task.assignedTo.toString(), "live_notification", {
        type: "task_status_changed",
        message: `The status of your task "${task.title}" was changed to ${status.replace("_", " ")}`,
        data: task,
      });
    }

    return task;
  }
}

module.exports = new TaskService();
