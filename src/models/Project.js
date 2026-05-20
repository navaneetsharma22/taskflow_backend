const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

// Apply multi-tenant isolation plugin
ProjectSchema.plugin(tenantPlugin);

module.exports = mongoose.model("Project", ProjectSchema);
