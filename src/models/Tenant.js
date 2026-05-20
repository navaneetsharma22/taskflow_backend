const mongoose = require("mongoose");

const TenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a tenant name"],
      trim: true,
      maxlength: [100, "Name cannot be more than 100 characters"],
    },
    slug: {
      type: String,
      required: [true, "Please add a slug"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    domain: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "trialing", "past_due", "canceled"],
      default: "trialing",
    },
    settings: {
      theme: {
        type: String,
        default: "dark",
      },
      allowedDomains: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Create index on slug and domain for fast resolution
TenantSchema.index({ slug: 1 });
TenantSchema.index({ domain: 1 });

module.exports = mongoose.model("Tenant", TenantSchema);
