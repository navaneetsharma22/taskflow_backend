const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add an organization name"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro", "enterprise"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "trialing", "past_due", "canceled"],
        default: "trialing",
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organization must have an owner"],
    },
    slug: {
      type: String,
      required: [true, "Please add a slug"],
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Organization", OrganizationSchema);
