const authService = require("../../services/auth/authService");
const UserSession = require("../../models/UserSession");
const {
  createUserSession,
  revokeUserSession,
  listActiveSessions,
} = require("../../utils/sessionHelper");

/**
 * Helper function to send token response and set HttpOnly cookie
 */
const sendTokenResponse = (user, accessToken, refreshToken, statusCode, res) => {
  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict",
  };

  res
    .status(statusCode)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
};

class AuthController {
  /**
   * @desc    Register a new user inside the active organization context
   * @route   POST /api/auth/register
   * @access  Public (scoped to active organization context)
   */
  register = async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const organizationId = req.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: "Organization identification is required to register",
        });
      }

      const { user, accessToken, refreshToken } = await authService.registerUser({
        organizationId,
        name,
        email,
        password,
        role,
      });

      // Track session and device information
      await createUserSession(user._id, refreshToken, req.ip, req.headers["user-agent"]);

      sendTokenResponse(user, accessToken, refreshToken, 201, res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Login user inside the active organization context
   * @route   POST /api/auth/login
   * @access  Public (scoped to active organization context)
   */
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const organizationId = req.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: "Organization identification is required to login",
        });
      }

      const { user, accessToken, refreshToken } = await authService.loginUser({
        email,
        password,
      });

      // Track session and device information
      await createUserSession(user._id, refreshToken, req.ip, req.headers["user-agent"]);

      sendTokenResponse(user, accessToken, refreshToken, 200, res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Logout user & clear refresh token cookie
   * @route   POST /api/auth/logout
   * @access  Private
   */
  logout = async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      // Revoke the database session
      if (refreshToken) {
        await revokeUserSession(refreshToken);
      }

      res.cookie("refreshToken", "", {
        httpOnly: true,
        expires: new Date(0), // expire immediately
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Refresh access token
   * @route   POST /api/auth/refresh
   * @access  Public
   */
  refresh = async (req, res, next) => {
    try {
      // Get refresh token from cookie or request body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: "Refresh token is missing",
        });
      }

      const { user, accessToken, refreshToken: newRefreshToken } =
        await authService.refreshAccessToken({ refreshToken });

      // Revoke old session and register new session due to refresh token rotation
      await revokeUserSession(refreshToken);
      await createUserSession(user._id, newRefreshToken, req.ip, req.headers["user-agent"]);

      sendTokenResponse(user, accessToken, newRefreshToken, 200, res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get all active sessions for the current user (device tracking)
   * @route   GET /api/auth/sessions
   * @access  Private
   */
  getSessions = async (req, res, next) => {
    try {
      const sessions = await listActiveSessions(req.user.id);
      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Revoke specific user session (remote logout)
   * @route   DELETE /api/auth/sessions/:id
   * @access  Private
   */
  revokeSession = async (req, res, next) => {
    try {
      const sessionId = req.params.id;
      
      // Delete session ensuring ownership check
      const result = await UserSession.deleteOne({
        _id: sessionId,
        userId: req.user.id,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: "Session not found or unauthorized",
        });
      }

      res.status(200).json({
        success: true,
        message: "Session successfully revoked",
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AuthController();
