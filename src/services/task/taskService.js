const Task = require("../../models/Task");
const User = require("../../models/User");
const Project = require("../../models/Project");
const { broadcastToOrg, emitToUser } = require("../../sockets/socketServer");
const webhookService = require("../webhookService");
const { escapeRegex } = require("../../utils/sanitize");

class TaskService {
  /**
   * Create a new task within the organization
   */
  async createTask(taskData, createdByUserId) {
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

    // HIGH-4: Whitelist allowed fields to prevent mass assignment
    const task = await Task.create({
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: taskData.status,
      dueDate: taskData.dueDate,
      assignedTo: taskData.assignedTo,
      projectId: taskData.projectId,
      createdBy: createdByUserId, // CRIT-5: Track task ownership
    });

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
      // HIGH-2: Escape regex special characters to prevent ReDoS
      const safeSearch = escapeRegex(search);
      queryConditions.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Pagination calculations
    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = Math.min(parseInt(limit) || 10, 100); // Cap limit at 100

    // PERF-1: Run count + find in parallel
    const [totalDocs, tasks] = await Promise.all([
      Task.countDocuments(queryConditions),
      Task.find(queryConditions)
        .populate("assignedTo", "name email role")
        .populate("projectId", "title status")
        .populate("createdBy", "name email")
        .sort(sort)
        .skip(skipCount)
        .limit(parsedLimit),
    ]);

    return {
      tasks,
      pagination: {
        total: totalDocs,
        page: parseInt(page),
        limit: parsedLimit,
        pages: Math.ceil(totalDocs / parsedLimit),
      },
    };
  }

  /**
   * Update a task's full properties
   */
  async updateTask(taskId, updateData, requestingUser) {
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

    // Fetch task first for ownership check
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    // CRIT-5: Enforce ownership — only creator, assignee, manager, or admin can update
    const isOwner = existingTask.createdBy?.toString() === requestingUser.id;
    const isAssignee = existingTask.assignedTo?.toString() === requestingUser.id;
    const isPrivileged = ["admin", "manager"].includes(requestingUser.role);
    if (!isOwner && !isAssignee && !isPrivileged) {
      const error = new Error("You are not authorized to update this task");
      error.statusCode = 403;
      throw error;
    }

    // HIGH-4: Whitelist allowed update fields
    const allowedFields = {};
    const whitelist = ["title", "description", "priority", "status", "dueDate", "assignedTo", "projectId"];
    for (const key of whitelist) {
      if (updateData[key] !== undefined) {
        allowedFields[key] = updateData[key];
      }
    }

    const task = await Task.findByIdAndUpdate(taskId, allowedFields, {
      new: true,
      runValidators: true,
    });

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
  async deleteTask(taskId, requestingUser) {
    // Fetch task first for ownership check
    const task = await Task.findById(taskId);
    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    // CRIT-5: Enforce ownership — only creator, manager, or admin can delete
    const isOwner = task.createdBy?.toString() === requestingUser.id;
    const isPrivileged = ["admin", "manager"].includes(requestingUser.role);
    if (!isOwner && !isPrivileged) {
      const error = new Error("You are not authorized to delete this task");
      error.statusCode = 403;
      throw error;
    }

    await Task.findByIdAndDelete(taskId);

    // Real-time Event: Broadcast task deletion inside organization room
    broadcastToOrg(task.organizationId, "task_deleted", { taskId });

    // Webhook Trigger: Notify organization's webhooks
    webhookService.trigger(task.organizationId, "task.deleted", { taskId });

    return task;
  }

  /**
   * Explicitly assign a task to a user
   */
  async assignTask(taskId, userId, requestingUser) {
    let user = null;
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        const error = new Error("User does not exist in this organization");
        error.statusCode = 404;
        throw error;
      }
    }

    // CRIT-5: Only managers/admins or the task creator can reassign
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    const isOwner = existingTask.createdBy?.toString() === requestingUser.id;
    const isPrivileged = ["admin", "manager"].includes(requestingUser.role);
    if (!isOwner && !isPrivileged) {
      const error = new Error("You are not authorized to reassign this task");
      error.statusCode = 403;
      throw error;
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      { assignedTo: userId || null },
      { new: true, runValidators: true }
    );

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
  async changeStatus(taskId, status, requestingUser) {
    const validStatuses = ["backlog", "todo", "in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
      error.statusCode = 400;
      throw error;
    }

    // CRIT-5: Only creator, assignee, manager, or admin can change status
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    const isOwner = existingTask.createdBy?.toString() === requestingUser.id;
    const isAssignee = existingTask.assignedTo?.toString() === requestingUser.id;
    const isPrivileged = ["admin", "manager"].includes(requestingUser.role);
    if (!isOwner && !isAssignee && !isPrivileged) {
      const error = new Error("You are not authorized to change the status of this task");
      error.statusCode = 403;
      throw error;
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true, runValidators: true }
    );

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
