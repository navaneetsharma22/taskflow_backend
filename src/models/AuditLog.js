const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g. 'api_key_created', 'webhook_deleted', 'role_changed'
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Apply multi-tenant isolation plugin
AuditLogSchema.plugin(tenantPlugin);

// Index for query streams
AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
