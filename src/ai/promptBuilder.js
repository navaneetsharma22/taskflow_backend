const { sanitizePromptInput } = require("../utils/sanitize");

/**
 * Generates highly structured, targeted prompt instructions for Gemini AI
 * All user inputs are sanitized to prevent prompt injection attacks
 */
class PromptBuilder {
  /**
   * Build prompt to break down a task into a set of distinct subtasks
   */
  buildTaskBreakdownPrompt(title, description) {
    const safeTitle = sanitizePromptInput(title, 200);
    const safeDesc = sanitizePromptInput(description, 2000);

    return `
You are an expert project management assistant. Break down the following complex task into 3 to 6 logical, actionable subtasks or steps.
Task Title: "${safeTitle}"
Task Description: "${safeDesc || "No description provided."}"

Return the result STRICTLY as a raw JSON object. Do not include markdown code block syntax (like \`\`\`json) or any extra conversational text.
Expected JSON Format:
{
  "subtasks": [
    {
      "title": "Subtask Title",
      "description": "Short explanation of what needs to be done"
    }
  ]
}
`;
  }

  /**
   * Build prompt to analyze title and description and suggest a task priority
   */
  buildPriorityDetectionPrompt(title, description) {
    const safeTitle = sanitizePromptInput(title, 200);
    const safeDesc = sanitizePromptInput(description, 2000);

    return `
You are an expert triage and risk assessment system. Analyze the task title and description to detect its appropriate priority level.
Task Title: "${safeTitle}"
Task Description: "${safeDesc || "No description provided."}"

Allowed priority levels: "low", "medium", "high", "critical"

Return the result STRICTLY as a raw JSON object. Do not include markdown code block syntax (like \`\`\`json) or any extra conversational text.
Expected JSON Format:
{
  "suggestedPriority": "priority_level",
  "reasoning": "A concise explanation of why this priority was chosen based on urgency, scope, and technical risk mentioned in the text."
}
`;
  }

  /**
   * Build prompt to generate a project roadmap (milestones & phases)
   */
  buildProjectRoadmapPrompt(title, description) {
    const safeTitle = sanitizePromptInput(title, 200);
    const safeDesc = sanitizePromptInput(description, 2000);

    return `
You are a senior technical program manager. Create a high-level roadmap with 3 distinct project phases/milestones for the following project.
Project Title: "${safeTitle}"
Project Description: "${safeDesc || "No description provided."}"

Return the result STRICTLY as a raw JSON object. Do not include markdown code block syntax (like \`\`\`json) or any extra conversational text.
Expected JSON Format:
{
  "phases": [
    {
      "phase": "Phase/Milestone Title",
      "timeline": "Estimated timeframe, e.g. Weeks 1-2",
      "items": [
        "Roadmap action item 1",
        "Roadmap action item 2"
      ]
    }
  ]
}
`;
  }

  /**
   * Build prompt to summarize long task details or discussion threads
   */
  buildTaskSummaryPrompt(taskTitle, taskDescription, comments = []) {
    const safeTitle = sanitizePromptInput(taskTitle, 200);
    const safeDesc = sanitizePromptInput(taskDescription, 2000);

    const formattedComments = comments
      .slice(0, 20) // Limit to 20 comments to prevent payload bloat
      .map((c) => `- ${sanitizePromptInput(c.userId?.name || "Member", 50)}: "${sanitizePromptInput(c.content, 300)}"`)
      .join("\n");

    return `
You are a senior technical writer. Create a concise, professional executive summary of the following task and its discussion comments.
Task Title: "${safeTitle}"
Task Description: "${safeDesc || "No description provided."}"
Task Discussion Comments:
${formattedComments || "No comments posted yet."}

Return a clean, bulleted executive summary (maximum 3 bullet points, under 150 words total). Do not include JSON or markdown blocks. Just provide standard text.
`;
  }
  /**
   * Build prompt to structure a daily agenda/plan based on active tasks
   */
  buildDailyPlanPrompt(tasks = []) {
    const formattedTasks = tasks
      .slice(0, 15) // Limit to prevent payload bloat
      .map((t) => `- [${sanitizePromptInput(t.priority || "medium", 10).toUpperCase()}] "${sanitizePromptInput(t.title, 100)}" - status: ${sanitizePromptInput(t.status || "todo", 15)}`)
      .join("\n");

    return `
You are a peak personal productivity coach. Create a structured hourly daily plan/agenda for a professional given the following assigned tasks.
Assigned Tasks:
${formattedTasks || "No tasks currently assigned for today."}

Format the day into a highly actionable, hourly schedule starting from 9:00 AM to 5:00 PM. Include breaks and a primary "Focus Milestone" of the day.

Return the result STRICTLY as a raw JSON object. Do not include markdown code block syntax (like \`\`\`json) or any extra conversational text.
Expected JSON Format:
{
  "focusMilestone": "Primary goal for the day",
  "schedule": [
    {
      "time": "9:00 AM - 10:00 AM",
      "activity": "Focus action item (e.g. Code Review)",
      "associatedTask": "Task title if applicable or 'General'"
    }
  ]
}
`;
  }
}

module.exports = new PromptBuilder();
