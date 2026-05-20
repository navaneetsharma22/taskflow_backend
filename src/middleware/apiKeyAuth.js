const crypto = require("crypto");
const ApiKey = require("../models/ApiKey");
const Organization = require("../models/Organization");
const { runInContext } = require("../utils/tenantContext");

/**
 * Middleware to authenticate requests using an API Key
 * Expected header: 'X-API-Key' or 'Authorization: Bearer tf_live_...'
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    let rawKey = req.headers["x-api-key"];

    // Fallback: Check Authorization header
    if (!rawKey && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      const bearerValue = req.headers.authorization.split(" ")[1];
      if (bearerValue.startsWith("tf_live_")) {
        rawKey = bearerValue;
      }
    }

    if (!rawKey) {
      return res.status(401).json({
        success: false,
        error: "Access denied. API key is missing.",
      });
    }

    // 1. Compute SHA-256 hash of the incoming raw key
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

    // 2. Query the ApiKey model (using a global bypass since ApiKey itself uses tenantPlugin)
    // To query ApiKeys globally (across tenants) for validation, we bypass Mongoose query filter temporarily
    // Or we query globally. Since Mongoose tenantPlugin only hooks query when organizationId context is active,
    // and when this middleware starts the context is NOT set yet, Mongoose will query across all API Keys naturally!
    // This is incredibly elegant!
    const apiKeyDoc = await ApiKey.findOne({ key: hashedKey, isActive: true });

    if (!apiKeyDoc) {
      return res.status(401).json({
        success: false,
        error: "Access denied. Invalid or suspended API key.",
      });
    }

    // 3. Resolve Organization and verify subscription status
    const organization = await Organization.findById(apiKeyDoc.organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: "Organization associated with this API key no longer exists.",
      });
    }

    if (
      organization.subscription &&
      ["canceled", "past_due"].includes(organization.subscription.status)
    ) {
      return res.status(403).json({
        success: false,
        error: "Organization subscription is inactive. Please update billing info.",
      });
    }

    // 4. Update lastUsedAt timestamp asynchronously
    apiKeyDoc.lastUsedAt = new Date();
    await apiKeyDoc.save({ validateBeforeSave: false });

    // 5. Establish AsyncLocalStorage context & attach metadata to request
    const organizationId = apiKeyDoc.organizationId.toString();

    runInContext(organizationId, () => {
      req.organizationId = organizationId;
      req.organization = organization;
      req.apiKey = apiKeyDoc;
      req.isApiKey = true; // flag indicating API Key auth
      next();
    });
  } catch (error) {
    console.error("API Key Authentication Error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during API Key validation.",
    });
  }
};

module.exports = apiKeyAuth;
