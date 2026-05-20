const express = require("express");
const router = express.Router();
const analyticsController = require("../../controllers/analytics/analyticsController");
const resolveTenant = require("../../middleware/tenant.middleware");
const { protect, authorize } = require("../../middleware/auth/authMiddleware");

// Secure all analytical routes under active organization scope
router.use(resolveTenant);
router.use(protect);

// Only managers and admins can view org-wide analytics
router.get("/dashboard", authorize("admin", "manager"), analyticsController.getDashboardAnalytics);

module.exports = router;
