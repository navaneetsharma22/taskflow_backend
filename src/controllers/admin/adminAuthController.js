const adminAuthService = require("../../services/admin/adminAuthService");

class AdminAuthController {
  /**
   * @desc    SuperAdmin Login
   * @route   POST /api/admin/login
   */
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Please enter email and password" });
      }

      const { accessToken, refreshToken, superAdmin } = await adminAuthService.login(
        email,
        password,
        req.ip,
        req.headers["user-agent"]
      );

      // Set Refresh Token in secure HttpOnly cookie
      res.cookie("adminRefreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        accessToken,
        superAdmin,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    SuperAdmin Logout
   * @route   POST /api/admin/logout
   */
  logout = async (req, res, next) => {
    try {
      const refreshToken = req.cookies.adminRefreshToken;
      await adminAuthService.logout(refreshToken);

      // Clear cookies
      res.clearCookie("adminRefreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    SuperAdmin Refresh Token Rotation
   * @route   POST /api/admin/refresh
   */
  refresh = async (req, res, next) => {
    try {
      const refreshToken = req.cookies.adminRefreshToken;
      const { accessToken, refreshToken: newRefreshToken } = await adminAuthService.refresh(
        refreshToken,
        req.ip,
        req.headers["user-agent"]
      );

      // Reset Refresh Token cookie with new value
      res.cookie("adminRefreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AdminAuthController();
