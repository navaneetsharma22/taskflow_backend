const mongoose = require("mongoose");
const { getOrganizationId } = require("./tenantContext");

/**
 * Mongoose plugin to automatically apply organizationId filter
 */
module.exports = function tenantPlugin(schema, options) {
  // Add organizationId field to schema automatically if not already present
  if (!schema.paths.organizationId) {
    schema.add({
      organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: [true, "organizationId is required for this collection"],
        index: true,
      },
    });
  }

  // Pre-find hooks to automatically inject the organizationId filter
  const autoFilterTenant = function (next) {
    const orgId = getOrganizationId();

    // Only apply the filter if organizationId is in context
    if (orgId) {
      this.where({ organizationId: orgId });
    }
    next();
  };

  // Register for all search query types
  schema.pre("find", autoFilterTenant);
  schema.pre("findOne", autoFilterTenant);
  schema.pre("findOneAndUpdate", autoFilterTenant);
  schema.pre("updateOne", autoFilterTenant);
  schema.pre("updateMany", autoFilterTenant);
  schema.pre("deleteOne", autoFilterTenant);
  schema.pre("deleteMany", autoFilterTenant);
  schema.pre("countDocuments", autoFilterTenant);
  schema.pre("estimatedDocumentCount", autoFilterTenant);

  // Pre-save hook to automatically populate organizationId from context
  schema.pre("validate", function (next) {
    const orgId = getOrganizationId();
    if (orgId && !this.organizationId) {
      this.organizationId = orgId;
    }
    next();
  });

  // Pre-aggregate hook to automatically scope analytical pipelines
  schema.pre("aggregate", function (next) {
    const orgId = getOrganizationId();
    if (orgId) {
      this.pipeline().unshift({
        $match: { organizationId: new mongoose.Types.ObjectId(orgId) },
      });
    }
    next();
  });
};
