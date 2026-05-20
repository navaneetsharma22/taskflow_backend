const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification must belong to a user"],
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true, // e.g. 'task_assigned', 'status_changed', 'comment_added'
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // e.g. { taskId: '...' }
    },
  },
  {
    timestamps: true,
  }
);

// Apply multi-tenant isolation plugin
NotificationSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Notification", NotificationSchema);
