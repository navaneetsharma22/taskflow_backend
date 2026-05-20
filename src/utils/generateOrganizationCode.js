const crypto = require("crypto");
const Organization = require("../models/Organization");

/**
 * Generates a cryptographically secure, unique organization code.
 * Format: AX-XXXXXXX (where X is a secure random digit)
 * Checks database for uniqueness and automatically retries if duplicate is found.
 */
const generateOrganizationCode = async (maxRetries = 10) => {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    attempts++;
    
    // Cryptographically secure generation of 7-digit integer
    const randomNum = crypto.randomInt(0, 10000000);
    const code = `AX-${randomNum.toString().padStart(7, "0")}`;

    // Verify uniqueness globally in MongoDB
    const existingOrg = await Organization.findOne({ code });
    if (!existingOrg) {
      return code;
    }
  }

  throw new Error("Unable to generate unique organization code after maximum retry threshold");
};

module.exports = generateOrganizationCode;
