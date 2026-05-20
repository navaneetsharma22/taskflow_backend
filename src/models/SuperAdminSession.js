const mongoose = require("mongoose");

const SuperAdminSessionSchema = new mongoose.Schema(
  {
    superAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true, // stores SHA-256 hashed refresh token representation
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
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

// Automatically remove expired sessions from DB
SuperAdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("SuperAdminSession", SuperAdminSessionSchema);
