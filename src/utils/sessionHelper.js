const crypto = require("crypto");
const UserSession = require("../models/UserSession");
const parseUserAgent = require("./deviceParser");

/**
 * Helper to compute SHA-256 hash of a session token
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Create a new user session and log the device details
 */
const createUserSession = async (userId, rawRefreshToken, ipAddress, userAgentString) => {
  try {
    const hashedToken = hashToken(rawRefreshToken);
    const deviceDetails = parseUserAgent(userAgentString);
    
    // Refresh token is valid for 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create the session
    const session = await UserSession.create({
      userId,
      token: hashedToken,
      ipAddress,
      userAgent: userAgentString || "unknown",
      device: deviceDetails,
      expiresAt,
    });

    return session;
  } catch (error) {
    console.error("Failed to create user session:", error.message);
  }
};

/**
 * Revoke/delete a user session
 */
const revokeUserSession = async (rawRefreshToken) => {
  try {
    if (!rawRefreshToken) return;
    const hashedToken = hashToken(rawRefreshToken);
    
    // Remove the session completely
    await UserSession.deleteOne({ token: hashedToken });
  } catch (error) {
    console.error("Failed to revoke session:", error.message);
  }
};

/**
 * List all active sessions for a user
 */
const listActiveSessions = async (userId) => {
  try {
    const sessions = await UserSession.find({
      userId,
      expiresAt: { $gt: new Date() },
    })
      .select("ipAddress device createdAt updatedAt")
      .sort("-createdAt");

    return sessions;
  } catch (error) {
    console.error("Failed to list active sessions:", error.message);
    return [];
  }
};

/**
 * Revoke all sessions for a user except the current one (optional premium feature)
 */
const revokeOtherSessions = async (userId, currentRawRefreshToken) => {
  try {
    const hashedToken = hashToken(currentRawRefreshToken);
    await UserSession.deleteMany({
      userId,
      token: { $ne: hashedToken },
    });
  } catch (error) {
    console.error("Failed to revoke other sessions:", error.message);
  }
};

module.exports = {
  createUserSession,
  revokeUserSession,
  listActiveSessions,
  revokeOtherSessions,
};
