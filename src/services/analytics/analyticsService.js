const Task = require("../../models/Task");
const Project = require("../../models/Project");
const User = require("../../models/User");

class AnalyticsService {
  /**
   * Aggregate task, project, and team workloads for the active organization
   */
  async getDashboardAnalytics() {
    // 1. Task totals by Status
    const statusCounts = await Task.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusMap = { backlog: 0, todo: 0, in_progress: 0, completed: 0 };
    let totalTasks = 0;
    statusCounts.forEach((item) => {
      if (item._id in statusMap) {
        statusMap[item._id] = item.count;
        totalTasks += item.count;
      }
    });

    // 2. Task totals by Priority
    const priorityCounts = await Task.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const priorityMap = { low: 0, medium: 0, high: 0, critical: 0 };
    priorityCounts.forEach((item) => {
      if (item._id in priorityMap) {
        priorityMap[item._id] = item.count;
      }
    });

    // 3. Project totals
    const projectCounts = await Project.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const projectStatusMap = { planning: 0, active: 0, completed: 0, on_hold: 0 };
    let totalProjects = 0;
    projectCounts.forEach((item) => {
      if (item._id in projectStatusMap) {
        projectStatusMap[item._id] = item.count;
        totalProjects += item.count;
      }
    });

    // 4. Team Workload (Tasks per assignee)
    const workloadCounts = await Task.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          taskCount: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
      {
        // Populate user details manually since aggregate bypasses Mongoose population
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          taskCount: 1,
          completedCount: 1,
          user: {
            name: { $ifNull: ["$userDetails.name", "Unassigned"] },
            email: { $ifNull: ["$userDetails.email", "N/A"] },
          },
        },
      },
    ]);

    // Calculate completion rate percentage
    const completedTasks = statusMap.completed;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      summary: {
        totalTasks,
        completedTasks,
        completionRate,
        totalProjects,
      },
      tasksByStatus: statusMap,
      tasksByPriority: priorityMap,
      projectsByStatus: projectStatusMap,
      teamWorkload: workloadCounts,
    };
  }
}

module.exports = new AnalyticsService();
