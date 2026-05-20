const express = require("express");
const router = express.Router();
const adminAuthController = require("../../controllers/admin/adminAuthController");

// Public admin authentication endpoints
router.post("/login", adminAuthController.login);
router.post("/logout", adminAuthController.logout);
router.post("/refresh", adminAuthController.refresh);

module.exports = router;
