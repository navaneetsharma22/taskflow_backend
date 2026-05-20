const express = require("express");
const router = express.Router();
const aiController = require("../../controllers/ai/aiController");
const resolveTenant = require("../../middleware/tenant.middleware");
const { protect } = require("../../middleware/auth/authMiddleware");

// Enforce auth and multi-tenant scoping for all AI requests
router.use(resolveTenant);
router.use(protect);

router.post("/breakdown", aiController.getTaskBreakdown);
router.post("/priority", aiController.detectPriority);
router.post("/roadmap", aiController.generateProjectRoadmap);
router.post("/summary", aiController.getTaskSummary);
router.post("/daily-plan", aiController.getDailyPlan);
router.get("/history", aiController.getAiHistory);

module.exports = router;
