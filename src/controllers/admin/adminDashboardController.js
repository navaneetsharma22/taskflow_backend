const adminDashboardService = require("../../services/admin/adminDashboardService");

class AdminDashboardController {
  /**
   * @desc    Get global analytics dashboard metrics
   * @route   GET /api/admin/dashboard
   * @access  Private (SuperAdmin only)
   */
  getDashboardMetrics = async (req, res, next) => {
    try {
      const data = await adminDashboardService.getDashboardAnalytics();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AdminDashboardController();
