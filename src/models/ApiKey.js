const mongoose = require("mongoose");
const tenantPlugin = require("../utils/tenantPlugin");

const ApiKeySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name for the API Key"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    key: {
      type: String,
      required: true,
      unique: true, // hashed representation
    },
    partialKey: {
      type: String,
      required: true, // visible preview, e.g. 'tf_live_...A4b8'
    },
    role: {
      type: String,
      enum: ["read", "write", "admin"],
      default: "read",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Apply multi-tenant isolation plugin
ApiKeySchema.plugin(tenantPlugin);

module.exports = mongoose.model("ApiKey", ApiKeySchema);
