const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["backlog", "todo", "in_progress", "completed"],
      default: "todo",
    },
    dueDate: {
      type: Date,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must have a creator"],
    },
  },
  {
    timestamps: true,
  }
);

// Apply multi-tenant isolation plugin
TaskSchema.plugin(tenantPlugin);

// Compound indexes for high-performance tenant-scoped queries (PERF-6 / DB-1)
TaskSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
TaskSchema.index({ organizationId: 1, assignedTo: 1 });
TaskSchema.index({ organizationId: 1, projectId: 1 });
TaskSchema.index({ organizationId: 1, dueDate: 1 });

module.exports = mongoose.model("Task", TaskSchema);
