const express = require("express");
const router = express.Router();
const analyticsController = require("../../controllers/analytics/analyticsController");
const resolveTenant = require("../../middleware/tenant.middleware");
const { protect } = require("../../middleware/auth/authMiddleware");

// Secure all analytical routes under active organization scope
router.use(resolveTenant);
router.use(protect);

router.get("/dashboard", analyticsController.getDashboardAnalytics);

module.exports = router;
