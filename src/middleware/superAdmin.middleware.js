const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/SuperAdmin");

/**
 * Middleware to protect super admin routes and enforce strictly super_admin role validation
 */
const superAdminProtect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, error: "Access denied. Authentication token missing." });
    }

    // Verify access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate role constraint explicitly
    if (decoded.role !== "super_admin") {
      return res.status(403).json({ success: false, error: "Access denied. SuperAdmin access required." });
    }

    const superAdmin = await SuperAdmin.findById(decoded.id);
    if (!superAdmin || superAdmin.status === "suspended") {
      return res.status(403).json({ success: false, error: "Access denied. Suspended or invalid admin credentials." });
    }

    // Attach verified SuperAdmin profile to request
    req.admin = superAdmin;
    next();
  } catch (error) {
    console.error("SuperAdmin Authentication Error:", error.message);
    return res.status(401).json({ success: false, error: "Authentication failed. Token is invalid or expired." });
  }
};

module.exports = superAdminProtect;
