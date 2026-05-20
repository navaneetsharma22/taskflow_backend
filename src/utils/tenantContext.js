const { AsyncLocalStorage } = require("async_hooks");

// Create storage instance for organization context
const tenantStorage = new AsyncLocalStorage();

/**
 * Run a function within an organization context
 */
const runInContext = (organizationId, fn) => {
  return tenantStorage.run(organizationId, fn);
};

/**
 * Retrieve the active organizationId from context
 */
const getOrganizationId = () => {
  return tenantStorage.getStore();
};

module.exports = {
  runInContext,
  getOrganizationId,
};
