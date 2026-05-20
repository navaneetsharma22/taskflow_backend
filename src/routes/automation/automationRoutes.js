const express = require("express");
const router = express.Router();
const automationController = require("../../controllers/automation/automationController");
const resolveTenant = require("../../middleware/tenant.middleware");
const { protect, authorize } = require("../../middleware/auth/authMiddleware");

// Enforce auth and multi-tenant scoping for all automation requests
router.use(resolveTenant);
router.use(protect);

// Only managers and admins can configure automation rules
router
  .route("/")
  .post(authorize("admin", "manager"), automationController.createRule)
  .get(automationController.getRules);

router
  .route("/:id")
  .put(authorize("admin", "manager"), automationController.updateRule)
  .delete(authorize("admin", "manager"), automationController.deleteRule);

router.post("/trigger", authorize("admin", "manager"), automationController.triggerRulesEvaluation);

module.exports = router;
