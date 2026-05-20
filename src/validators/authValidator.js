/**
 * Helper validator middleware for auth requests
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ success: false, error: "Name is required" });
  }

  if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return res.status(400).json({ success: false, error: "Please provide a valid email address" });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, error: "Password must be at least 6 characters long" });
  }

  if (role && !["admin", "manager", "employee"].includes(role)) {
    return res.status(400).json({ success: false, error: "Invalid role specified" });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return res.status(400).json({ success: false, error: "Please provide a valid email address" });
  }

  if (!password || password.trim() === "") {
    return res.status(400).json({ success: false, error: "Password is required" });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
};
