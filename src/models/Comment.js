const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const CommentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Comment must belong to a task"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment must have an author"],
    },
    content: {
      type: String,
      required: [true, "Comment content cannot be empty"],
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Apply multi-tenant isolation plugin
CommentSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Comment", CommentSchema);
