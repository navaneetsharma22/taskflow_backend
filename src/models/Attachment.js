const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const AttachmentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Attachment must belong to a task"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Attachment must have an uploader"],
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
    },
    fileSize: {
      type: Number, // in bytes
    },
  },
  {
    timestamps: true,
  }
);

// Apply multi-tenant isolation plugin
AttachmentSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Attachment", AttachmentSchema);
