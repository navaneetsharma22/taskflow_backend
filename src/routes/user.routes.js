const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const resolveTenant = require("../middleware/tenant.middleware");
const { protect, authorize } = require("../middleware/auth/authMiddleware");

// All user management operations require active organization context and user authentication
router.use(resolveTenant);
router.use(protect);

// GET all team members (Any authenticated member of the organization can list their team)
router.get("/", userController.getUsers);

// POST invite a new team member (Only admin or manager can invite new team members)
router.post("/invite", authorize("admin", "manager"), userController.inviteUser);

// PUT update a team member's role (Only admin can change team roles)
router.put("/:id/role", authorize("admin"), userController.updateUserRole);

// PUT suspend/activate a team member (Only admin can suspend/activate accounts)
router.put("/:id/status", authorize("admin"), userController.toggleUserStatus);

module.exports = router;
