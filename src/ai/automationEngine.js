const gemini = require("./gemini");
const promptBuilder = require("./promptBuilder");
const AiHistory = require("../models/AiHistory");

class AutomationEngine {
  /**
   * Helper to strip markdown code blocks if the LLM returned them
   */
  cleanJsonString(str) {
    if (!str) return "";
    let cleaned = str.trim();
    
    // Remove starting ```json or ```
    cleaned = cleaned.replace(/^```(json)?/gi, "");
    // Remove ending ```
    cleaned = cleaned.replace(/```$/g, "");
    
    return cleaned.trim();
  }

  /**
   * Orchestrate Task Breakdown generation
   */
  async getTaskBreakdown(userId, title, description) {
    const prompt = promptBuilder.buildTaskBreakdownPrompt(title, description);
    const rawResult = await gemini.generateContent(prompt);
    
    let parsedResult;
    try {
      const cleanJson = this.cleanJsonString(rawResult);
      parsedResult = JSON.parse(cleanJson);
    } catch (error) {
      console.warn("Failed to parse Gemini task breakdown response as JSON. Returning raw text.", error.message);
      parsedResult = { rawText: rawResult };
    }

    // Save to AI History (scoped automatically to organizationId by tenantPlugin!)
    await AiHistory.create({
      userId,
      featureType: "task_breakdown",
      prompt,
      response: parsedResult,
    });

    return parsedResult;
  }

  /**
   * Orchestrate Task Priority Triage
   */
  async detectPriority(userId, title, description) {
    const prompt = promptBuilder.buildPriorityDetectionPrompt(title, description);
    const rawResult = await gemini.generateContent(prompt);

    let parsedResult;
    try {
      const cleanJson = this.cleanJsonString(rawResult);
      parsedResult = JSON.parse(cleanJson);
    } catch (error) {
      console.warn("Failed to parse Gemini priority detection response as JSON.", error.message);
      parsedResult = { suggestedPriority: "medium", reasoning: rawResult };
    }

    // Save to AI History
    await AiHistory.create({
      userId,
      featureType: "priority_detection",
      prompt,
      response: parsedResult,
    });

    return parsedResult;
  }

  /**
   * Orchestrate Project Roadmap generation
   */
  async generateProjectRoadmap(userId, title, description) {
    const prompt = promptBuilder.buildProjectRoadmapPrompt(title, description);
    const rawResult = await gemini.generateContent(prompt);

    let parsedResult;
    try {
      const cleanJson = this.cleanJsonString(rawResult);
      parsedResult = JSON.parse(cleanJson);
    } catch (error) {
      console.warn("Failed to parse Gemini project roadmap response as JSON.", error.message);
      parsedResult = { rawText: rawResult };
    }

    // Save to AI History
    await AiHistory.create({
      userId,
      featureType: "roadmap_generation",
      prompt,
      response: parsedResult,
    });

    return parsedResult;
  }

  /**
   * Orchestrate Task/Discussion summary generation
   */
  async getTaskSummary(userId, taskTitle, taskDescription, comments = []) {
    const prompt = promptBuilder.buildTaskSummaryPrompt(taskTitle, taskDescription, comments);
    const summaryText = await gemini.generateContent(prompt);

    // Save to AI History
    await AiHistory.create({
      userId,
      featureType: "task_summary",
      prompt,
      response: { summary: summaryText },
    });

    return { summary: summaryText };
  }

  /**
   * Orchestrate Daily Agenda planner generation
   */
  async getDailyPlan(userId, tasks = []) {
    const prompt = promptBuilder.buildDailyPlanPrompt(tasks);
    const rawResult = await gemini.generateContent(prompt);

    let parsedResult;
    try {
      const cleanJson = this.cleanJsonString(rawResult);
      parsedResult = JSON.parse(cleanJson);
    } catch (error) {
      console.warn("Failed to parse Gemini daily agenda response as JSON.", error.message);
      parsedResult = { rawText: rawResult };
    }

    // Save to AI History
    await AiHistory.create({
      userId,
      featureType: "daily_plan",
      prompt,
      response: parsedResult,
    });

    return parsedResult;
  }
}

module.exports = new AutomationEngine();
