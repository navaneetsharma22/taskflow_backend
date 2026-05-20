const User = require("../../models/User");
const jwt = require("jsonwebtoken");

class AuthService {
  /**
   * Register a new user in a specific tenant
   */
  async registerUser({ tenantId, name, email, password, role }) {
    // Check if user already exists in this tenant
    const existingUser = await User.findOne({ tenantId, email });
    if (existingUser) {
      const error = new Error("Email is already registered for this tenant");
      error.statusCode = 400;
      throw error;
    }

    // Create the user
    const user = await User.create({
      tenantId,
      name,
      email,
      password,
      role: role || "employee",
    });

    // Generate tokens
    const accessToken = user.getSignedJwtToken();
    const refreshToken = user.getSignedRefreshJwtToken();

    return { user, accessToken, refreshToken };
  }

  /**
   * Login user in a specific tenant
   */
  async loginUser({ tenantId, email, password }) {
    // Find user and explicitly select password field
    const user = await User.findOne({ tenantId, email }).select("+password");
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
   */
  async refreshAccessToken({ refreshToken }) {
    if (!refreshToken) {
      const error = new Error("No refresh token provided");
      error.statusCode = 400;
      throw error;
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

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
      const error = new Error("Invalid or expired refresh token");
      error.statusCode = 401;
      throw error;
    }
  }
}

module.exports = new AuthService();
