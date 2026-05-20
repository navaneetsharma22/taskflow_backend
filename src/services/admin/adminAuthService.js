const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const SuperAdmin = require("../../models/SuperAdmin");
const SuperAdminSession = require("../../models/SuperAdminSession");

class AdminAuthService {
  /**
   * Generates secure JWT Access and Refresh Tokens
   */
  generateTokens(superAdminId) {
    const accessToken = jwt.sign(
      { id: superAdminId, role: "super_admin" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Refresh token is a random high-entropy hex string
    const refreshToken = crypto.randomBytes(40).toString("hex");
    return { accessToken, refreshToken };
  }

  /**
   * Login SuperAdmin
   */
  async login(email, password, ipAddress, userAgent) {
    // Find SuperAdmin with password explicitly selected
    const superAdmin = await SuperAdmin.findOne({ email }).select("+password");
    if (!superAdmin) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }

    if (superAdmin.status === "suspended") {
      const error = new Error("Account has been suspended");
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await superAdmin.matchPassword(password);
    if (!isMatch) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }

    // Update last login timestamp
    superAdmin.lastLogin = new Date();
    await superAdmin.save();

    // Generate token set
    const { accessToken, refreshToken } = this.generateTokens(superAdmin._id.toString());

    // Hash refresh token for DB storage (rotation tracking)
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Save refresh token session in database
    await SuperAdminSession.create({
      superAdminId: superAdmin._id,
      token: hashedToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      accessToken,
      refreshToken,
      superAdmin: {
        _id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
      },
    };
  }

  /**
   * Invalidate session (Logout)
   */
  async logout(refreshToken) {
    if (!refreshToken) return;
    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await SuperAdminSession.findOneAndDelete({ token: hashedToken });
  }

  /**
   * Rotate Refresh Token and return new Access Token
   */
  async refresh(refreshToken, ipAddress, userAgent) {
    if (!refreshToken) {
      const error = new Error("Refresh token missing");
      error.statusCode = 401;
      throw error;
    }

    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Find session in database
    const session = await SuperAdminSession.findOne({ token: hashedToken });
    if (!session || session.expiresAt < new Date()) {
      // If session not found but valid refresh token was passed, this might be a replay attack!
      // Revoke all sessions for the associated user if replay is suspected.
      if (session) {
        await SuperAdminSession.deleteMany({ superAdminId: session.superAdminId });
      }
      const error = new Error("Invalid or expired session");
      error.statusCode = 401;
      throw error;
    }

    // Refresh Token Rotation (RTR): delete old session
    await SuperAdminSession.findByIdAndDelete(session._id);

    // Verify SuperAdmin status
    const superAdmin = await SuperAdmin.findById(session.superAdminId);
    if (!superAdmin || superAdmin.status === "suspended") {
      const error = new Error("Session revoked or account suspended");
      error.statusCode = 403;
      throw error;
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(superAdmin._id.toString());
    const newHashedToken = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

    // Save new session in database
    await SuperAdminSession.create({
      superAdminId: superAdmin._id,
      token: newHashedToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}

module.exports = new AdminAuthService();
