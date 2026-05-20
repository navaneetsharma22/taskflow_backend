const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const ProjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["planning", "active", "completed", "on_hold"],
      default: "planning",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Apply multi-tenant isolation plugin
ProjectSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Project", ProjectSchema);
