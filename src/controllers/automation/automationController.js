const AutomationRule = require("../../models/AutomationRule");
const { evaluateDueCheckRules } = require("../../jobs/scheduler");

class AutomationController {
  /**
   * @desc    Create an automation rule
   * @route   POST /api/automations
   * @access  Private (scoped to active organization)
   */
  createRule = async (req, res, next) => {
    try {
      const { name, trigger, conditions, actions, isActive } = req.body;

      if (!name || !trigger || !conditions || !actions) {
        return res.status(400).json({
          success: false,
          error: "Rule name, trigger, conditions, and actions are required",
        });
      }

      const rule = await AutomationRule.create({
        name,
        trigger,
        conditions,
        actions,
        isActive: isActive !== undefined ? isActive : true,
      });

      res.status(201).json({
        success: true,
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get all automation rules of the organization
   * @route   GET /api/automations
   * @access  Private (scoped to active organization)
   */
  getRules = async (req, res, next) => {
    try {
      const rules = await AutomationRule.find().sort("-createdAt");
      res.status(200).json({
        success: true,
        data: rules,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Update an automation rule
   * @route   PUT /api/automations/:id
   * @access  Private (scoped to active organization)
   */
  updateRule = async (req, res, next) => {
    try {
      const rule = await AutomationRule.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!rule) {
        return res.status(404).json({
          success: false,
          error: "Rule not found",
        });
      }

      res.status(200).json({
        success: true,
        data: rule,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Delete an automation rule
   * @route   DELETE /api/automations/:id
   * @access  Private (scoped to active organization)
   */
  deleteRule = async (req, res, next) => {
    try {
      const rule = await AutomationRule.findByIdAndDelete(req.params.id);

      if (!rule) {
        return res.status(404).json({
          success: false,
          error: "Rule not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Automation rule deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Manually trigger evaluation of all active due-date rules (Admin testing)
   * @route   POST /api/automations/trigger
   * @access  Private (admin only)
   */
  triggerRulesEvaluation = async (req, res, next) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({
          success: false,
          error: "Unauthorized access. Only managers/admins can manually trigger rules.",
        });
      }

      // Run due check rules asynchronously
      evaluateDueCheckRules();

      res.status(200).json({
        success: true,
        message: "Due-date rules evaluation triggered successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AutomationController();
