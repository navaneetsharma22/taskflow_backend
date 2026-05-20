/**
 * Generates highly structured, targeted prompt instructions for Gemini AI
 */
class PromptBuilder {
  /**
   * Build prompt to break down a task into a set of distinct subtasks
   */
  buildTaskBreakdownPrompt(title, description) {
    return `
You are an expert project management assistant. Break down the following complex task into 3 to 6 logical, actionable subtasks or steps.
Task Title: "${title}"
Task Description: "${description || "No description provided."}"

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
    return `
You are an expert triage and risk assessment system. Analyze the task title and description to detect its appropriate priority level.
Task Title: "${title}"
Task Description: "${description || "No description provided."}"

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
    return `
You are a senior technical program manager. Create a high-level roadmap with 3 distinct project phases/milestones for the following project.
Project Title: "${title}"
Project Description: "${description || "No description provided."}"

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
    const formattedComments = comments
      .map((c) => `- User (${c.userId?.name || "Member"}): "${c.content}"`)
      .join("\n");

    return `
You are a senior technical writer. Create a concise, professional executive summary of the following task and its discussion comments.
Task Title: "${taskTitle}"
Task Description: "${taskDescription || "No description provided."}"
Task Discussion Comments:
${formattedComments || "No comments posted yet."}

Return a clean, bulleted executive summary (maximum 3 bullet points, under 150 words total). Do not include JSON or markdown blocks. Just provide standard text.
`;
  }
}

module.exports = new PromptBuilder();
