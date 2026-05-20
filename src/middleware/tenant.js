const Tenant = require("../models/Tenant");

/**
 * Middleware to resolve and validate the tenant for the request.
 * It looks for a tenant identifier in:
 * 1. Headers: 'X-Tenant-ID' or 'X-Tenant-Slug'
 * 2. Hostname/Subdomain (e.g., 'tenant-slug.example.com')
 */
const resolveTenant = async (req, res, next) => {
  try {
    let tenantIdentifier = req.headers["x-tenant-id"] || req.headers["x-tenant-slug"];

    // Fallback: Resolve via host/subdomain if no header is present
    if (!tenantIdentifier) {
      const host = req.headers.host; // e.g., acme.taskflow.com or localhost:5000
      if (host && !host.includes("localhost") && host.split(".").length > 2) {
        tenantIdentifier = host.split(".")[0]; // returns 'acme'
      }
    }

    if (!tenantIdentifier) {
      return res.status(400).json({
        success: false,
        error: "Tenant identification missing in headers or domain",
      });
    }

    // Find the tenant by ID or slug
    let tenant;
    if (tenantIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      tenant = await Tenant.findById(tenantIdentifier);
    } else {
      tenant = await Tenant.findOne({ slug: tenantIdentifier.toLowerCase() });
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: "Tenant not found",
      });
    }

    if (!tenant.isActive) {
      return res.status(403).json({
        success: false,
        error: "Tenant account is suspended or inactive",
      });
    }

    // Attach tenant details to the request object
    req.tenant = tenant;
    req.tenantId = tenant._id.toString();

    next();
  } catch (error) {
    console.error("Tenant Resolution Error:", error);
    res.status(500).json({
      success: false,
      error: "Server encountered an error resolving tenant",
    });
  }
};

module.exports = { resolveTenant };
