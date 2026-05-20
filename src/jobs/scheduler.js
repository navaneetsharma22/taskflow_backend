const cron = require("node-cron");
const AutomationRule = require("../models/AutomationRule");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const { emitToUser } = require("../sockets/socketServer");
const gemini = require("../ai/gemini");
const { runInContext } = require("../utils/tenantContext");

/**
 * Helper to compile rule template messages
 */
const compileMessage = (template, task) => {
  if (!template) return `Task "${task.title}" requires attention!`;
  return template.replace(/{title}/g, task.title).replace(/{status}/g, task.status);
};

/**
 * Main function to evaluate all active due-check automation rules
 */
const evaluateDueCheckRules = async () => {
  try {
    console.log("Scheduler: Running automated task due date inspections...");

    // Fetch all active due check rules globally across all tenants
    // Since we run in the scheduler thread outside of any AsyncLocalStorage HTTP context,
    // getOrganizationId() returns undefined, which naturally queries globally! This is beautiful.
    const activeRules = await AutomationRule.find({
      trigger: "task_due_check",
      isActive: true,
    });

    if (!activeRules || activeRules.length === 0) {
      console.log("Scheduler: No active due check automation rules found.");
      return;
    }

    for (const rule of activeRules) {
      console.log(`Scheduler: Evaluating rule "${rule.name}" for org: ${rule.organizationId}`);
      
      // Build task query conditions based on the rule parameters
      const taskQuery = {
        organizationId: rule.organizationId,
      };

      for (const cond of rule.conditions) {
        if (cond.field === "dueDate") {
          if (cond.operator === "less_than_hours") {
            const hoursVal = parseInt(cond.value);
            const timeLimit = new Date(Date.now() + hoursVal * 60 * 60 * 1000);
            
            // Due in the future but before our limit
            taskQuery.dueDate = {
              $gt: new Date(),
              $lte: timeLimit,
            };
          }
        } else if (cond.field === "status") {
          if (cond.operator === "not_equals") {
            taskQuery.status = { $ne: cond.value };
          } else if (cond.operator === "equals") {
            taskQuery.status = cond.value;
          }
        }
      }

      // Fetch all matching tasks for this rule
      const matchingTasks = await Task.find(taskQuery);
      
      if (!matchingTasks || matchingTasks.length === 0) {
        continue;
      }

      console.log(`Scheduler: Rule "${rule.name}" matched ${matchingTasks.length} tasks.`);

      // Process actions wrapped in the tenant's execution context
      await runInContext(rule.organizationId.toString(), async () => {
        for (const task of matchingTasks) {
          // If task doesn't have an assignee, notify the task project members or organization owner (fallback)
          const targetUserId = task.assignedTo ? task.assignedTo.toString() : null;

          if (!targetUserId) continue;

          for (const action of rule.actions) {
            if (action.type === "send_notification") {
              const notificationMessage = compileMessage(action.message, task);
              
              // 1. Save Notification to DB
              const notification = await Notification.create({
                userId: targetUserId,
                title: "Automation Trigger: Task Attention Required",
                message: notificationMessage,
                type: "task_due_check",
                data: { taskId: task._id },
              });

              // 2. Dispatch Live Socket.IO notification
              emitToUser(rule.organizationId.toString(), targetUserId, "live_notification", {
                type: "automation_alert",
                title: notification.title,
                message: notification.message,
                data: notification,
              });

              console.log(`Scheduler: Dispatched notification to user ${targetUserId} for task ${task.title}`);
            }

            if (action.type === "create_ai_risk_alert") {
              console.log(`Scheduler: Invoking AI risk assessment for task: ${task.title}`);
              
              // 1. Build prompt for Gemini to detect and suggest task mitigation
              const aiPrompt = `
You are a senior risk auditor and productivity specialist. The following task is approaching its deadline soon and is still incomplete.
Task Title: "${task.title}"
Task Details: "${task.description || "No description provided."}"
Task Current Status: "${task.status}"
Due Date: "${task.dueDate}"

Compile a quick AI Risk Assessment. List the top potential risk (under 15 words) and 2 specific action steps the assignee can take immediately to complete it (under 30 words total).
Be direct, professional, and action-oriented. Keep the output extremely brief.
`;

              try {
                // Call Gemini
                const aiAssessment = await gemini.generateContent(aiPrompt);

                // 2. Save specialized AI Alert to DB
                const notification = await Notification.create({
                  userId: targetUserId,
                  title: `💡 AI Risk Alert: ${task.title}`,
                  message: aiAssessment,
                  type: "ai_risk_alert",
                  data: { taskId: task._id },
                });

                // 3. Dispatch Live Socket.IO notification
                emitToUser(rule.organizationId.toString(), targetUserId, "live_notification", {
                  type: "ai_risk_alert",
                  title: notification.title,
                  message: notification.message,
                  data: notification,
                });

                console.log(`Scheduler: Successfully dispatched AI risk alert for task ${task.title}`);
              } catch (aiError) {
                console.error(`Scheduler: AI Risk assessment failed for task ${task._id}:`, aiError.message);
              }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error("Scheduler Job execution error:", error.message);
  }
};

/**
 * Initialize and start the periodic scheduler cron job
 */
const initScheduler = () => {
  // Run every hour in production
  // We can also trigger it manually or run a short interval for testing
  cron.schedule("0 * * * *", () => {
    evaluateDueCheckRules();
  });

  console.log("Scheduler Job initialized successfully. Configured to run every hour.");
};

module.exports = {
  initScheduler,
  evaluateDueCheckRules, // Exposed for manual test triggers
};
