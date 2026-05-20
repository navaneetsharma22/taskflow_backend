const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g. 'created', 'updated', 'deleted', 'assigned'
    },
    entityType: {
      type: String,
      required: true, // e.g. 'task', 'project', 'comment'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // e.g. { previousStatus: 'todo', newStatus: 'in_progress' }
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // only track when logged
  }
);

// Apply multi-tenant isolation plugin
ActivityLogSchema.plugin(tenantPlugin);

// Create compound index for querying activity stream
ActivityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
