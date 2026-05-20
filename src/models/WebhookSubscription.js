const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const WebhookSubscriptionSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Webhook payload URL is required"],
      trim: true,
      match: [
        /^(https?):\/\/[^\s$.?#].[^\s]*$/gm,
        "Please enter a valid HTTP/HTTPS URL",
      ],
    },
    events: [
      {
        type: String,
        enum: [
          "task.created",
          "task.updated",
          "task.deleted",
          "project.created",
          "project.updated",
          "project.deleted",
          "comment.created",
        ],
        default: ["task.created", "task.updated"],
      },
    ],
    secret: {
      type: String,
      required: true, // HMAC signing secret, e.g., 'whsec_...'
    },
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
WebhookSubscriptionSchema.plugin(tenantPlugin);

module.exports = mongoose.model("WebhookSubscription", WebhookSubscriptionSchema);
