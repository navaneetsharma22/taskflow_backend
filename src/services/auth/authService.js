const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const UserSession = require("../../models/UserSession");

class AuthService {
  /**
   * Register a new user inside the active organization context
   */
  async registerUser({ organizationId, name, email, password, role }) {
    // Check if user already exists inside this organization
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("Email is already registered for this organization");
      error.statusCode = 400;
      throw error;
    }

    // HIGH-5: Force employee role on public registration — admin/manager must be assigned separately
    const user = await User.create({
      name,
      email,
      password,
      role: "employee",
    });

    // Generate tokens
    const accessToken = user.getSignedJwtToken();
    const refreshToken = user.getSignedRefreshJwtToken();

    return { user, accessToken, refreshToken };
  }

  /**
   * Login user inside the active organization context
   */
  async loginUser({ email, password }) {
    // Find user inside the active organization (automatically filtered by our Mongoose plugin!)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error("Account is suspended");
      error.statusCode = 403;
      throw error;
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }

    // Generate tokens
    const accessToken = user.getSignedJwtToken();
    const refreshToken = user.getSignedRefreshJwtToken();

    // Remove password from returned user object
    user.password = undefined;

    return { user, accessToken, refreshToken };
  }

  /**
   * Refresh the access token using a valid refresh token
   * CRIT-7: Validates token against session store to honor revocations
   */
  async refreshAccessToken({ refreshToken }) {
    if (!refreshToken) {
      const error = new Error("No refresh token provided");
      error.statusCode = 400;
      throw error;
    }

    try {
      // Verify refresh token signature
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // CRIT-7: Validate the token against the session store
      const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
      const activeSession = await UserSession.findOne({ token: hashedToken });
      if (!activeSession) {
        const error = new Error("Session has been revoked. Please log in again.");
        error.statusCode = 401;
        throw error;
      }

      // Find user
      const user = await User.findById(decoded.id);
      if (!user) {
        const error = new Error("Session invalid. User not found.");
        error.statusCode = 401;
        throw error;
      }

      if (!user.isActive) {
        const error = new Error("User account is suspended");
        error.statusCode = 403;
        throw error;
      }

      // Generate new tokens (token rotation for security)
      const newAccessToken = user.getSignedJwtToken();
      const newRefreshToken = user.getSignedRefreshJwtToken();

      return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (err) {
      // Re-throw if it's our own custom error
      if (err.statusCode) throw err;
      const error = new Error("Invalid or expired refresh token");
      error.statusCode = 401;
      throw error;
    }
  }
}

module.exports = new AuthService();
