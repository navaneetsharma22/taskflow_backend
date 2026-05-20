const express = require("express");
const router = express.Router();
const adminAuthController = require("../../controllers/admin/adminAuthController");
const adminOrganizationController = require("../../controllers/admin/adminOrganizationController");
const { protectAdmin } = require("../../middleware/adminAuthMiddleware");

// Public admin authentication endpoints
router.post("/login", adminAuthController.login);
router.post("/logout", adminAuthController.logout);
router.post("/refresh", adminAuthController.refresh);

// Protected admin operations
router.use(protectAdmin); // Enforce SuperAdmin context globally for all operational endpoints below

router.post("/create-organization", adminOrganizationController.createOrganization);
router.get("/organizations", adminOrganizationController.getAllOrganizations);
router.get("/organization/:id", adminOrganizationController.getOrganizationById);
router.put("/organization/:id", adminOrganizationController.updateOrganization);
router.delete("/organization/:id", adminOrganizationController.deleteOrganization);
router.patch("/organization/:id/status", adminOrganizationController.updateStatus);
router.patch("/organization/:id/subscription", adminOrganizationController.updateSubscription);
router.patch("/organization/:id/settings", adminOrganizationController.updateSettings);

module.exports = router;
