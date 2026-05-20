const express = require("express");
const router = express.Router();
const authController = require("../../controllers/auth/authController");
const resolveTenant = require("../../middleware/tenant.middleware");
const { protect } = require("../../middleware/auth/authMiddleware");
const { validateRegister, validateLogin } = require("../../validators/authValidator");
const { authLimiter } = require("../../middleware/rateLimiter");

// All register/login requests must be scoped to a valid, active organization context
router.post("/register", authLimiter, resolveTenant, validateRegister, authController.register);
router.post("/login", authLimiter, resolveTenant, validateLogin, authController.login);

// Refresh token does not require active tenant resolution (it is contained inside the token payload)
router.post("/refresh", authController.refresh);

// Logout clear cookies
router.post("/logout", protect, authController.logout);

// Session Management & Device Tracking
router.get("/sessions", protect, authController.getSessions);
router.delete("/sessions/:id", protect, authController.revokeSession);

module.exports = router;

