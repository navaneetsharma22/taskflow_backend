const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tenantPlugin = require("../utils/tenantPlugin");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
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

// Encrypt password using bcrypt before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT and return (15 minutes expiration)
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, organizationId: this.organizationId, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

// Sign Refresh JWT and return (7 days expiration)
UserSchema.methods.getSignedRefreshJwtToken = function () {
  return jwt.sign(
    { id: this._id, organizationId: this.organizationId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// Apply multi-tenant isolation plugin
UserSchema.plugin(tenantPlugin);

// Ensure uniqueness of email within each organization
UserSchema.index({ organizationId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);
