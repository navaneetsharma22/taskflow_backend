const express = require("express");
const router = express.Router();
const automationController = require("../../controllers/automation/automationController");
const resolveTenant = require("../../middleware/tenant.middleware");
const { protect } = require("../../middleware/auth/authMiddleware");

// Enforce auth and multi-tenant scoping for all automation requests
router.use(resolveTenant);
router.use(protect);

router
  .route("/")
  .post(automationController.createRule)
  .get(automationController.getRules);

router
  .route("/:id")
  .put(automationController.updateRule)
  .delete(automationController.deleteRule);

router.post("/trigger", automationController.triggerRulesEvaluation);

module.exports = router;
