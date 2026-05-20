const Organization = require("../models/Organization");
const { runInContext } = require("../utils/tenantContext");

/**
 * Enterprise Multi-Tenant Resolver Middleware
 * Identifies the organization context from:
 * 1. Headers: 'X-Organization-ID' or 'X-Organization-Slug'
 * 2. Domain / Subdomain (e.g., 'acme.taskflow.com')
 * 
 * Then binds the resolved context to the AsyncLocalStorage execution store.
 */
const resolveTenant = async (req, res, next) => {
  try {
    let orgIdentifier = req.headers["x-organization-id"] || req.headers["x-organization-slug"];

    // Fallback: Resolve via host subdomain
    if (!orgIdentifier) {
      const host = req.headers.host;
      if (host && !host.includes("localhost") && host.split(".").length > 2) {
        orgIdentifier = host.split(".")[0];
      }
    }

    // Secondary Fallback: Check request body/query for convenience
    if (!orgIdentifier) {
      orgIdentifier = req.body.organizationId || req.query.organizationId;
    }

    if (!orgIdentifier) {
      return res.status(400).json({
        success: false,
        error: "Organization identification missing. Include X-Organization-ID header.",
      });
    }

    let organization;
    if (orgIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      organization = await Organization.findById(orgIdentifier);
    } else {
      organization = await Organization.findOne({ slug: orgIdentifier.toLowerCase() });
    }

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: "Organization not found",
      });
    }

    // Enforce SaaS active subscriptions
    if (
      organization.subscription &&
      ["canceled", "past_due"].includes(organization.subscription.status)
    ) {
      return res.status(403).json({
        success: false,
        error: `Organization subscription is ${organization.subscription.status}. Please update payment details.`,
      });
    }

    const organizationId = organization._id.toString();

    // Bind downstream handlers to AsyncLocalStorage context
    runInContext(organizationId, () => {
      // Attach to req object for backward compatibility and ease of access
      req.organizationId = organizationId;
      req.organization = organization;
      
      next();
    });
  } catch (error) {
    console.error("Multi-Tenant Middleware Error:", error);
    res.status(500).json({
      success: false,
      error: "Server encountered an error resolving organization context",
    });
  }
};

module.exports = resolveTenant;
