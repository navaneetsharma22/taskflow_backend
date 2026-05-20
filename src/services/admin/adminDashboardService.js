const Organization = require("../../models/Organization");
const User = require("../../models/User");
const Attachment = require("../../models/Attachment");
const AiHistory = require("../../models/AiHistory");
const Task = require("../../models/Task");

class AdminDashboardService {
  /**
   * Helper to format storage bytes to human readable format
   */
  formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  /**
   * Fetch global super admin dashboard analytics
   */
  async getDashboardAnalytics() {
    // 1. Organization Analytics
    const totalOrgs = await Organization.countDocuments({});
    const activeOrgs = await Organization.countDocuments({ status: "active" });
    const suspendedOrgs = await Organization.countDocuments({ status: "suspended" });

    // 2. User Analytics
    const totalUsers = await User.countDocuments({});

    // 3. Storage Usage (global sum of attachment file sizes)
    const storageGroup = await Attachment.aggregate([
      {
        $group: {
          _id: null,
          totalBytes: { $sum: "$fileSize" },
        },
      },
    ]);
    const storageBytes = storageGroup[0] ? storageGroup[0].totalBytes : 0;
    const storageUsageFormatted = this.formatBytes(storageBytes);

    // 4. Subscription Analytics (counts grouped by plan tier)
    const subAgg = await Organization.aggregate([
      {
        $group: {
          _id: "$subscription.plan",
          count: { $sum: 1 },
        },
      },
    ]);
    const subscriptionAnalytics = { free: 0, pro: 0, enterprise: 0 };
    subAgg.forEach((item) => {
      if (item._id && subscriptionAnalytics[item._id] !== undefined) {
        subscriptionAnalytics[item._id] = item.count;
      }
    });

    // 5. AI Usage
    const totalAiQueries = await AiHistory.countDocuments({});
    const aiAgg = await AiHistory.aggregate([
      {
        $group: {
          _id: "$featureType",
          count: { $sum: 1 },
        },
      },
    ]);
    const aiBreakdown = {
      task_breakdown: 0,
      priority_detection: 0,
      roadmap_generation: 0,
      task_summary: 0,
    };
    aiAgg.forEach((item) => {
      if (item._id && aiBreakdown[item._id] !== undefined) {
        aiBreakdown[item._id] = item.count;
      }
    });

    // 6. Task Statistics
    const totalTasks = await Task.countDocuments({});
    const taskAgg = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    const taskBreakdown = { backlog: 0, todo: 0, in_progress: 0, completed: 0 };
    taskAgg.forEach((item) => {
      if (item._id && taskBreakdown[item._id] !== undefined) {
        taskBreakdown[item._id] = item.count;
      }
    });

    return {
      "Total Organizations": totalOrgs,
      "Active Organizations": activeOrgs,
      "Suspended Organizations": suspendedOrgs,
      "Total Users": totalUsers,
      "Storage Usage": storageUsageFormatted,
      "Subscription Analytics": subscriptionAnalytics,
      "AI Usage": {
        totalQueries: totalAiQueries,
        breakdown: aiBreakdown,
      },
      "Task Statistics": {
        totalTasks: totalTasks,
        breakdown: taskBreakdown,
      },
    };
  }
}

module.exports = new AdminDashboardService();
