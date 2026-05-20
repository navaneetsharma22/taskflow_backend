const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const AutomationRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Rule name is required"],
      trim: true,
      maxlength: [100, "Rule name cannot exceed 100 characters"],
    },
    trigger: {
      type: String,
      enum: ["task_due_check", "task_updated", "task_created"],
      required: true,
      default: "task_due_check",
    },
    conditions: [
      {
        field: {
          type: String,
          required: true, // e.g. 'dueDate', 'status', 'priority'
        },
        operator: {
          type: String,
          required: true, // e.g. 'less_than_hours', 'not_equals', 'equals'
        },
        value: {
          type: mongoose.Schema.Types.Mixed, // e.g. 24, 'completed', 'high'
          required: true,
        },
      },
    ],
    actions: [
      {
        type: {
          type: String,
          required: true, // e.g. 'send_notification', 'create_ai_risk_alert'
        },
        target: {
          type: String, // e.g. 'assignee', 'manager', 'owner'
          default: "assignee",
        },
        message: {
          type: String, // Custom notification template, e.g. 'Task "{title}" is delayed!'
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply multi-tenant isolation plugin
AutomationRuleSchema.plugin(tenantPlugin);

module.exports = mongoose.model("AutomationRule", AutomationRuleSchema);
