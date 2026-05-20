const adminOrganizationService = require("../../services/admin/adminOrganizationService");

class AdminOrganizationController {
  /**
   * @desc    Create new Organization
   * @route   POST /api/admin/create-organization
   * @access  Private (SuperAdmin only)
   */
  createOrganization = async (req, res, next) => {
    try {
      const { name } = req.body;
      if (!name || name.trim() === "") {
        return res.status(400).json({ success: false, error: "Organization name is required" });
      }

      const org = await adminOrganizationService.createOrganization(name, req.admin._id);

      res.status(201).json({
        name: org.name,
        organizationCode: org.code,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get all organizations
   * @route   GET /api/admin/organizations
   * @access  Private (SuperAdmin only)
   */
  getAllOrganizations = async (req, res, next) => {
    try {
      const orgs = await adminOrganizationService.getAllOrganizations();
      res.status(200).json({ success: true, count: orgs.length, data: orgs });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get single organization details
   * @route   GET /api/admin/organization/:id
   * @access  Private (SuperAdmin only)
   */
  getOrganizationById = async (req, res, next) => {
    try {
      const org = await adminOrganizationService.getOrganizationById(req.params.id);
      res.status(200).json({ success: true, data: org });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Full update Organization attributes
   * @route   PUT /api/admin/organization/:id
   * @access  Private (SuperAdmin only)
   */
  updateOrganization = async (req, res, next) => {
    try {
      const org = await adminOrganizationService.updateOrganization(req.params.id, req.body);
      res.status(200).json({ success: true, message: "Organization updated successfully", data: org });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Delete Organization globally
   * @route   DELETE /api/admin/organization/:id
   * @access  Private (SuperAdmin only)
   */
  deleteOrganization = async (req, res, next) => {
    try {
      await adminOrganizationService.deleteOrganization(req.params.id);
      res.status(200).json({ success: true, message: "Organization deleted successfully from platform" });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Patch Organization status (Suspend / Activate)
   * @route   PATCH /api/admin/organization/:id/status
   * @access  Private (SuperAdmin only)
   */
  updateStatus = async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, error: "Status value is required (active or suspended)" });
      }

      const org = await adminOrganizationService.updateOrganizationStatus(req.params.id, status);
      res.status(200).json({
        success: true,
        message: `Organization status updated successfully to ${status}`,
        data: org,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Update Subscription plan
   * @route   PATCH /api/admin/organization/:id/subscription
   * @access  Private (SuperAdmin only)
   */
  updateSubscription = async (req, res, next) => {
    try {
      const org = await adminOrganizationService.updateOrganizationSubscription(req.params.id, req.body);
      res.status(200).json({ success: true, message: "Subscription plan updated successfully", data: org });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Update branding & workspace configs
   * @route   PATCH /api/admin/organization/:id/settings
   * @access  Private (SuperAdmin only)
   */
  updateSettings = async (req, res, next) => {
    try {
      const org = await adminOrganizationService.updateOrganizationSettings(req.params.id, req.body);
      res.status(200).json({ success: true, message: "Settings & branding updated successfully", data: org });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AdminOrganizationController();
