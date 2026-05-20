const express = require("express");
const router = express.Router();
const productionController = require("../../controllers/production/productionController");
const resolveTenant = require("../../middleware/tenant.middleware");
const { protect } = require("../../middleware/auth/authMiddleware");

// Enforce auth and multi-tenant scoping for all enterprise features
router.use(resolveTenant);
router.use(protect);

// Activity and Audit Logs
router.get("/activity-logs", productionController.getActivityLogs);
router.get("/audit-logs", productionController.getAuditLogs);

// API Keys Management
router.post("/api-keys", productionController.createApiKey);
router.get("/api-keys", productionController.getApiKeys);
router.delete("/api-keys/:id", productionController.deleteApiKey);

// Webhook subscriptions
router.post("/webhooks", productionController.createWebhook);
router.get("/webhooks", productionController.getWebhooks);
router.delete("/webhooks/:id", productionController.deleteWebhook);

// Active user sessions listing
router.get("/sessions", productionController.getSessions);

// Task File Upload attachment
router.post("/upload", productionController.uploadFile);

module.exports = router;
