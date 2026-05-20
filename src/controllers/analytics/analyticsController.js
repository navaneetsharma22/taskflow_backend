const analyticsService = require("../../services/analytics/analyticsService");

class AnalyticsController {
  /**
   * @desc    Get dashboard analytics metrics
   * @route   GET /api/analytics/dashboard
   * @access  Private (scoped to active organization)
   */
  getDashboardAnalytics = async (req, res, next) => {
    try {
      const analytics = await analyticsService.getDashboardAnalytics();
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AnalyticsController();
