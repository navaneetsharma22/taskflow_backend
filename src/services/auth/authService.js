const User = require("../../models/User");
const jwt = require("jsonwebtoken");

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

    // Create the user (organizationId is automatically set from context by our Mongoose plugin)
    const user = await User.create({
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

      // Find user (bypassing the Mongoose tenant filter is fine for token refreshes since we have user ID)
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
