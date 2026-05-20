const express = require("express");
const router = express.Router();
const authController = require("../../controllers/auth/authController");
const { resolveTenant } = require("../../middleware/tenant");
const { protect } = require("../../middleware/auth/authMiddleware");
const { validateRegister, validateLogin } = require("../../validators/authValidator");

// All register/login requests must be scoped to a valid, active tenant
router.post("/register", resolveTenant, validateRegister, authController.register);
router.post("/login", resolveTenant, validateLogin, authController.login);

// Refresh token does not require active tenant resolution (it is contained inside the token payload)
router.post("/refresh", authController.refresh);

// Logout clear cookies
router.post("/logout", protect, authController.logout);

module.exports = router;
