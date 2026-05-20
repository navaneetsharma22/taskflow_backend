const mongoose = require("mongoose");
const Organization = require("../models/Organization");
const User = require("../models/User");
const UserSession = require("../models/UserSession");
const { runInContext } = require("../utils/tenantContext");
const { createUserSession } = require("../utils/sessionHelper");
const organizationValidationService = require("../services/organization/organizationValidationService");

class OrganizationController {
  /**
   * @desc    Create a new organization along with its admin owner
   * @route   POST /api/organizations
   * @access  Public
   */
  createOrganization = async (req, res, next) => {
    try {
      const { orgName, slug, name, email, password } = req.body;

      if (!orgName || !slug || !name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: "Please provide all required fields: orgName, slug, name, email, password",
        });
      }

      // Check if organization slug already exists
      const cleanSlug = slug.toLowerCase().trim();
      const existingOrg = await Organization.findOne({ slug: cleanSlug });
      if (existingOrg) {
        return res.status(400).json({
          success: false,
          error: "Organization slug already in use. Try a different one.",
        });
      }

      // Check if user email is globally unique or already registered in this slug scope
      // In TaskFlow, user emails are unique within each organization, but to prevent
      // multi-tenant confusion on registration, we ensure it's not a duplicate.
      const userId = new mongoose.Types.ObjectId();

      // Create Organization first
      const organization = new Organization({
        name: orgName,
        slug: cleanSlug,
        owner: userId,
      });

      await organization.save();

      let user;
      let accessToken;
      let refreshToken;

      // Run user creation within the context of the new organization ID
      await runInContext(organization._id.toString(), async () => {
        // Double check if a user with this email exists in this organization (compound index check)
        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
          throw new Error("Email already registered in this organization scope.");
        }

        user = await User.create({
          _id: userId,
          name,
          email,
          password,
          role: "admin", // Owner is always admin
        });

        // Generate tokens
        accessToken = user.getSignedJwtToken();
        refreshToken = user.getSignedRefreshJwtToken();
      });

      // Track session and device information
      await createUserSession(user._id, refreshToken, req.ip, req.headers["user-agent"]);

      // Set cookie and respond
      const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      };

      res
        .status(201)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json({
          success: true,
          accessToken,
          organization: {
            id: organization._id,
            name: organization.name,
            slug: organization.slug,
          },
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Get organization profile details
   * @route   GET /api/organizations
   * @access  Private (scoped to active tenant)
   */
  getOrganization = async (req, res, next) => {
    try {
      const organization = await Organization.findById(req.organizationId).populate(
        "owner",
        "name email"
      );

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: "Organization not found",
        });
      }

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Update organization settings (Workspace Settings)
   * @route   PUT /api/organizations
   * @access  Private (scoped, Admin only)
   */
  updateOrganization = async (req, res, next) => {
    try {
      const { name, slug, plan } = req.body;
      const organization = await Organization.findById(req.organizationId);

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: "Organization not found",
        });
      }

      if (name) organization.name = name;
      if (slug) {
        const cleanSlug = slug.toLowerCase().trim();
        if (cleanSlug !== organization.slug) {
          // Ensure new slug is unique
          const existingOrg = await Organization.findOne({ slug: cleanSlug });
          if (existingOrg) {
            return res.status(400).json({
              success: false,
              error: "Organization slug already in use. Try a different one.",
            });
          }
          organization.slug = cleanSlug;
        }
      }
      if (plan) {
        organization.subscription.plan = plan;
        organization.subscription.status = "active";
      }

      await organization.save();

      res.status(200).json({
        success: true,
        message: "Organization settings updated successfully",
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Validate organization code
   * @route   POST /api/organizations/validate-code
   * @access  Public
   */
  validateCode = async (req, res, next) => {
    try {
      const { organizationCode } = req.body;
      const result = await organizationValidationService.validateOrganizationCode(organizationCode);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new OrganizationController();
