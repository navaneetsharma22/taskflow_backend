const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const UserSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true, // stores refresh token or session id hash
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    device: {
      type: {
        type: String,
        default: "desktop", // desktop, mobile, tablet, bot
      },
      os: {
        type: String,
        default: "unknown",
      },
      browser: {
        type: String,
        default: "unknown",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Apply multi-tenant isolation plugin
UserSessionSchema.plugin(tenantPlugin);

// Automatically remove expired sessions from DB
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("UserSession", UserSessionSchema);
