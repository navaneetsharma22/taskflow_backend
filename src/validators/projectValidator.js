const mongoose = require("mongoose");

/**
 * Helper to check valid Mongoose ObjectId format
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateCreateProject = (req, res, next) => {
  const { title, status, members } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ success: false, error: "Project title is required" });
  }

  if (status && !["planning", "active", "completed", "on_hold"].includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid status value specified" });
  }

  if (members !== undefined) {
    if (!Array.isArray(members)) {
      return res.status(400).json({ success: false, error: "Members must be an array of User IDs" });
    }

    const allValid = members.every((memberId) => isValidObjectId(memberId));
    if (!allValid) {
      return res.status(400).json({ success: false, error: "One or more User IDs inside members have an invalid format" });
    }
  }

  next();
};

const validateUpdateProject = (req, res, next) => {
  const { title, status, members } = req.body;

  if (title !== undefined && title.trim() === "") {
    return res.status(400).json({ success: false, error: "Project title cannot be empty" });
  }

  if (status && !["planning", "active", "completed", "on_hold"].includes(status)) {
    return res.status(400).json({ success: false, error: "Invalid status value specified" });
  }

  if (members !== undefined) {
    if (!Array.isArray(members)) {
      return res.status(400).json({ success: false, error: "Members must be an array of User IDs" });
    }

    const allValid = members.every((memberId) => isValidObjectId(memberId));
    if (!allValid) {
      return res.status(400).json({ success: false, error: "One or more User IDs inside members have an invalid format" });
    }
  }

  next();
};

module.exports = {
  validateCreateProject,
  validateUpdateProject,
};
