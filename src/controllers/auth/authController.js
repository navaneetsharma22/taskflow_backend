const authService = require("../../services/auth/authService");

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
        tenantId: user.tenantId,
      },
    });
};

class AuthController {
  /**
   * @desc    Register a new user inside the active tenant
   * @route   POST /api/auth/register
   * @access  Public (scoped to active tenant)
   */
  register = async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const tenantId = req.tenantId || req.body.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: "Tenant identification is required to register",
        });
      }

      const { user, accessToken, refreshToken } = await authService.registerUser({
        tenantId,
        name,
        email,
        password,
        role,
      });

      sendTokenResponse(user, accessToken, refreshToken, 201, res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Login user inside the active tenant
   * @route   POST /api/auth/login
   * @access  Public (scoped to active tenant)
   */
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const tenantId = req.tenantId || req.body.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: "Tenant identification is required to login",
        });
      }

      const { user, accessToken, refreshToken } = await authService.loginUser({
        tenantId,
        email,
        password,
      });

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

      sendTokenResponse(user, accessToken, newRefreshToken, 200, res);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AuthController();
