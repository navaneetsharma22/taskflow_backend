const Organization = require("../../models/Organization");

class OrganizationValidationService {
  /**
   * Validates an organization code, ensuring it exists and is active.
   * Returns the organization database ID.
   */
  async validateOrganizationCode(organizationCode) {
    if (!organizationCode || organizationCode.trim() === "") {
      const error = new Error("Organization code is required");
      error.statusCode = 400;
      throw error;
    }

    // Lookup organization globally by unique crypto code
    const org = await Organization.findOne({ code: organizationCode.trim() });
    if (!org) {
      const error = new Error("Invalid organization code. Organization not found.");
      error.statusCode = 404;
      throw error;
    }

    // Prevent suspended organization accesses
    if (org.status !== "active") {
      const error = new Error("Access denied. This organization has been suspended.");
      error.statusCode = 403;
      throw error;
    }

    return {
      organizationId: org._id.toString(),
      name: org.name,
      slug: org.slug,
    };
  }
}

module.exports = new OrganizationValidationService();
