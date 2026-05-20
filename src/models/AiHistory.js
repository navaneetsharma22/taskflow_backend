const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const AiHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    featureType: {
      type: String,
      enum: ["task_breakdown", "priority_detection", "roadmap_generation", "task_summary"],
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    response: {
      type: mongoose.Schema.Types.Mixed, // Stores raw string or structured JSON from Gemini
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply multi-tenant isolation plugin
AiHistorySchema.plugin(tenantPlugin);

// Query index
AiHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("AiHistory", AiHistorySchema);
