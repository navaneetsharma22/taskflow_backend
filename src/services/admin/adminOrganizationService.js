const Organization = require("../../models/Organization");
const generateOrganizationCode = require("../../utils/generateOrganizationCode");

class AdminOrganizationService {
  /**
   * Create an Organization by SuperAdmin
   */
  async createOrganization(name, superAdminId) {
    if (!name || name.trim() === "") {
      const error = new Error("Organization name is required");
      error.statusCode = 400;
      throw error;
    }

    const code = await generateOrganizationCode();

    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let existingOrg = await Organization.findOne({ slug });
    let suffix = 1;
    const baseSlug = slug;
    while (existingOrg) {
      slug = `${baseSlug}-${suffix}`;
      existingOrg = await Organization.findOne({ slug });
      suffix++;
    }

    const org = await Organization.create({
      name,
      code,
      slug,
      createdBy: superAdminId,
      status: "active",
      subscription: {
        plan: "free",
        status: "active",
      },
    });

    return org;
  }

  /**
   * Get all organizations
   */
  async getAllOrganizations() {
    return await Organization.find({}).sort("-createdAt").populate("owner", "name email");
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id) {
    const org = await Organization.findById(id).populate("owner", "name email");
    if (!org) {
      const error = new Error("Organization not found");
      error.statusCode = 404;
      throw error;
    }
    return org;
  }

  /**
   * Fully update Organization attributes
   */
  async updateOrganization(id, updateData) {
    const org = await Organization.findById(id);
    if (!org) {
      const error = new Error("Organization not found");
      error.statusCode = 404;
      throw error;
    }

    if (updateData.name) {
      org.name = updateData.name;
    }

    if (updateData.slug) {
      const cleanSlug = updateData.slug.toLowerCase().trim();
      if (cleanSlug !== org.slug) {
        const existing = await Organization.findOne({ slug: cleanSlug });
        if (existing) {
          const error = new Error("Slug already in use");
          error.statusCode = 400;
          throw error;
        }
        org.slug = cleanSlug;
      }
    }

    if (updateData.owner) {
      org.owner = updateData.owner;
    }

    await org.save();
    return org;
  }

  /**
   * Delete Organization globally from platform database
   */
  async deleteOrganization(id) {
    const org = await Organization.findByIdAndDelete(id);
    if (!org) {
      const error = new Error("Organization not found");
      error.statusCode = 404;
      throw error;
    }
    return org;
  }

  /**
   * Patch Organization status (Suspend / Activate)
   */
  async updateOrganizationStatus(id, status) {
    if (!["active", "suspended"].includes(status)) {
      const error = new Error("Invalid status state. Use active or suspended.");
      error.statusCode = 400;
      throw error;
    }

    const org = await Organization.findById(id);
    if (!org) {
      const error = new Error("Organization not found");
      error.statusCode = 404;
      throw error;
    }

    org.status = status;
    // Set internal subscription status to suspended if organization is suspended
    if (status === "suspended") {
      org.subscription.status = "suspended";
    } else {
      org.subscription.status = "active";
    }

    await org.save();
    return org;
  }

  /**
   * Update Subscription Tier properties
   */
  async updateOrganizationSubscription(id, subscriptionData) {
    const { plan, status } = subscriptionData;
    const org = await Organization.findById(id);
    if (!org) {
      const error = new Error("Organization not found");
      error.statusCode = 404;
      throw error;
    }

    if (plan && ["free", "pro", "enterprise"].includes(plan)) {
      org.subscription.plan = plan;
    }

    if (status && ["active", "trialing", "past_due", "canceled", "suspended"].includes(status)) {
      org.subscription.status = status;
    }

    await org.save();
    return org;
  }

  /**
   * Update Organization custom branding settings
   */
  async updateOrganizationSettings(id, settingsData) {
    const org = await Organization.findById(id);
    if (!org) {
      const error = new Error("Organization not found");
      error.statusCode = 404;
      throw error;
    }

    if (settingsData.name) {
      org.name = settingsData.name;
    }

    if (settingsData.branding) {
      const { logoUrl, primaryColor } = settingsData.branding;
      if (logoUrl !== undefined) org.branding.logoUrl = logoUrl;
      if (primaryColor !== undefined) org.branding.primaryColor = primaryColor;
    }

    await org.save();
    return org;
  }
}

module.exports = new AdminOrganizationService();
