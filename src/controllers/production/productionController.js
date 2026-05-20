const crypto = require("crypto");
const ActivityLog = require("../../models/ActivityLog");
const AuditLog = require("../../models/AuditLog");
const ApiKey = require("../../models/ApiKey");
const WebhookSubscription = require("../../models/WebhookSubscription");
const UserSession = require("../../models/UserSession");
const Attachment = require("../../models/Attachment");
const Task = require("../../models/Task");

class ProductionController {
  /**
   * @desc    Get activity logs
   * @route   GET /api/production/activity-logs
   */
  getActivityLogs = async (req, res, next) => {
    try {
      const logs = await ActivityLog.find()
        .populate("userId", "name email role")
        .sort("-createdAt")
        .limit(100);

      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get security audit logs
   * @route   GET /api/production/audit-logs
   */
  getAuditLogs = async (req, res, next) => {
    try {
      const logs = await AuditLog.find()
        .populate("userId", "name email role")
        .sort("-createdAt")
        .limit(100);

      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Create API Key
   * @route   POST /api/production/api-keys
   */
  createApiKey = async (req, res, next) => {
    try {
      const { name, role } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: "API Key name is required" });
      }

      // Generate a highly secure, signed API key prefix
      const keyBuffer = crypto.randomBytes(24);
      const rawKey = `tf_live_${keyBuffer.toString("hex")}`;
      const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");
      const partialKey = `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`;

      const apiKey = await ApiKey.create({
        name,
        key: hashedKey,
        partialKey,
        role: role || "read",
        isActive: true,
      });

      // Write log to audit logs
      await AuditLog.create({
        userId: req.user.id,
        action: "api_key_created",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        details: { keyId: apiKey._id, name },
      });

      // Return the RAW unhashed key only once to the client for copying
      res.status(201).json({
        success: true,
        data: {
          _id: apiKey._id,
          name: apiKey.name,
          partialKey: apiKey.partialKey,
          role: apiKey.role,
          isActive: apiKey.isActive,
          rawKey, // Client can view this key once
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get API Keys
   * @route   GET /api/production/api-keys
   */
  getApiKeys = async (req, res, next) => {
    try {
      const keys = await ApiKey.find().sort("-createdAt");
      res.status(200).json({ success: true, data: keys });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Delete/Revoke API Key
   * @route   DELETE /api/production/api-keys/:id
   */
  deleteApiKey = async (req, res, next) => {
    try {
      const key = await ApiKey.findByIdAndDelete(req.params.id);
      if (!key) {
        return res.status(404).json({ success: false, error: "API Key not found" });
      }

      await AuditLog.create({
        userId: req.user.id,
        action: "api_key_revoked",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        details: { keyId: req.params.id, name: key.name },
      });

      res.status(200).json({ success: true, message: "API key revoked successfully" });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Create Webhook subscription
   * @route   POST /api/production/webhooks
   */
  createWebhook = async (req, res, next) => {
    try {
      const { url, events } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, error: "Webhook url is required" });
      }

      // Generate a secret for validating signatures
      const secret = `whsec_${crypto.randomBytes(16).toString("hex")}`;

      const webhook = await WebhookSubscription.create({
        url,
        events: events || ["task.created", "task.updated"],
        secret,
        isActive: true,
      });

      await AuditLog.create({
        userId: req.user.id,
        action: "webhook_created",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        details: { webhookId: webhook._id, url },
      });

      res.status(201).json({ success: true, data: webhook });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get Webhook subscriptions
   * @route   GET /api/production/webhooks
   */
  getWebhooks = async (req, res, next) => {
    try {
      const webhooks = await WebhookSubscription.find().sort("-createdAt");
      res.status(200).json({ success: true, data: webhooks });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Delete Webhook subscription
   * @route   DELETE /api/production/webhooks/:id
   */
  deleteWebhook = async (req, res, next) => {
    try {
      const webhook = await WebhookSubscription.findByIdAndDelete(req.params.id);
      if (!webhook) {
        return res.status(404).json({ success: false, error: "Webhook not found" });
      }

      await AuditLog.create({
        userId: req.user.id,
        action: "webhook_deleted",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        details: { webhookId: req.params.id, url: webhook.url },
      });

      res.status(200).json({ success: true, message: "Webhook subscription deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get Active user sessions
   * @route   GET /api/production/sessions
   */
  getSessions = async (req, res, next) => {
    try {
      const sessions = await UserSession.find({ userId: req.user.id }).sort("-createdAt");
      res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Upload Task Attachment
   * @route   POST /api/production/upload
   */
  uploadFile = async (req, res, next) => {
    try {
      const { taskId, fileName, fileUrl, fileType, fileSize } = req.body;
      if (!taskId || !fileName || !fileUrl) {
        return res.status(400).json({ success: false, error: "taskId, fileName, and fileUrl are required" });
      }

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ success: false, error: "Task not found" });
      }

      const attachment = await Attachment.create({
        taskId,
        userId: req.user.id,
        fileName,
        fileUrl,
        fileType: fileType || "application/octet-stream",
        fileSize: fileSize || 1024,
      });

      // Write activity log
      await ActivityLog.create({
        userId: req.user.id,
        action: "attachment_uploaded",
        entityType: "task",
        entityId: taskId,
        details: { fileName, fileSize },
      });

      res.status(201).json({ success: true, data: attachment });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ProductionController();
