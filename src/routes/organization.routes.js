const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organization.controller");
const userController = require("../controllers/user.controller");
const resolveTenant = require("../middleware/tenant.middleware");
const { protect, authorize } = require("../middleware/auth/authMiddleware");

// 1. Organization Create (Public SaaS registration)
// POST /api/organization
router.post("/", organizationController.createOrganization);
router.post("/validate-code", organizationController.validateCode);

// Private routes require tenant context and authentication
router.use(resolveTenant);
router.use(protect);

// 2. GET organization details (Settings / Plan info)
// GET /api/organization
router.get("/", organizationController.getOrganization);

// 3. Invite team member (Requires Admin or Manager)
// POST /api/organization/invite
router.post("/invite", authorize("admin", "manager"), userController.inviteUser);

// 4. Update organization settings (Requires Admin)
// PUT /api/organization/settings
router.put("/settings", authorize("admin"), organizationController.updateOrganization);

module.exports = router;
