const User = require("../models/User");

class UserController {
  /**
   * @desc    Get all team members in the active organization
   * @route   GET /api/users
   * @access  Private (scoped to active tenant)
   */
  getUsers = async (req, res, next) => {
    try {
      // tenantPlugin automatically filters User.find({}) by the active organizationId!
      const users = await User.find({}).select("-password");

      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Invite a team member into the active organization
   * @route   POST /api/users/invite
   * @access  Private (scoped, Admin or Manager only)
   */
  inviteUser = async (req, res, next) => {
    try {
      const { name, email, role } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          error: "Please provide both name and email for the invitation",
        });
      }

      // Default role is employee if not specified
      const assignedRole = role || "employee";
      if (!["admin", "manager", "employee"].includes(assignedRole)) {
        return res.status(400).json({
          success: false,
          error: "Invalid role specified. Must be 'admin', 'manager', or 'employee'.",
        });
      }

      // Check if user already exists inside this organization context
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: "A team member with this email is already registered in this organization.",
        });
      }

      // In a production SaaS, this would send an invite email with a signup link.
      // Here, we create the user with a default temporary password so they can log in instantly.
      const tempPassword = "TaskFlowWelcome123!";

      const newUser = await User.create({
        name,
        email: email.toLowerCase().trim(),
        password: tempPassword,
        role: assignedRole,
        isActive: true,
      });

      // Remove password before returning
      newUser.password = undefined;

      res.status(201).json({
        success: true,
        message: `Invitation successfully sent to ${email}`,
        data: {
          user: newUser,
          tempPassword, // Return temporary password for demo ease
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Update a team member's role (Team Roles settings)
   * @route   PUT /api/users/:id/role
   * @access  Private (scoped, Admin only)
   */
  updateUserRole = async (req, res, next) => {
    try {
      const { role } = req.body;
      const targetUserId = req.params.id;

      if (!role || !["admin", "manager", "employee"].includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Please specify a valid role ('admin', 'manager', 'employee')",
        });
      }

      // Find user inside active organization context (auto-filtered)
      const user = await User.findById(targetUserId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found in this organization context",
        });
      }

      // Check if trying to demote the owner/self if they are the only admin
      if (user._id.toString() === req.user._id.toString() && role !== "admin") {
        return res.status(400).json({
          success: false,
          error: "You cannot change your own role from 'admin'",
        });
      }

      user.role = role;
      await user.save();

      res.status(200).json({
        success: true,
        message: `Successfully updated user role to ${role}`,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @desc    Suspend or activate a team member
   * @route   PUT /api/users/:id/status
   * @access  Private (scoped, Admin only)
   */
  toggleUserStatus = async (req, res, next) => {
    try {
      const targetUserId = req.params.id;

      const user = await User.findById(targetUserId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found in this organization context",
        });
      }

      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          error: "You cannot suspend your own account",
        });
      }

      user.isActive = !user.isActive;
      await user.save();

      res.status(200).json({
        success: true,
        message: `User account is now ${user.isActive ? "active" : "suspended"}`,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new UserController();
