const express = require("express");
const router = express.Router();
const projectController = require("../../controllers/project/projectController");
const resolveTenant = require("../../middleware/tenant.middleware");
const { protect } = require("../../middleware/auth/authMiddleware");
const {
  validateCreateProject,
  validateUpdateProject,
} = require("../../validators/projectValidator");

// Enforce authentication and multi-tenant scoping for all project actions
router.use(resolveTenant);
router.use(protect);

router
  .route("/")
  .post(validateCreateProject, projectController.createProject)
  .get(projectController.getProjects);

router
  .route("/:id")
  .put(validateUpdateProject, projectController.updateProject)
  .delete(projectController.deleteProject);

module.exports = router;
