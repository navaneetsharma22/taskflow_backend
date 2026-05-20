const express = require("express");
const router = express.Router();
const taskController = require("../../controllers/task/taskController");
const resolveTenant = require("../../middleware/tenant.middleware");
const { protect } = require("../../middleware/auth/authMiddleware");
const {
  validateCreateTask,
  validateUpdateTask,
  validateAssignTask,
  validateChangeStatus,
} = require("../../validators/taskValidator");

// Protect and resolve organization scope for all task operations
router.use(resolveTenant);
router.use(protect);

router
  .route("/")
  .post(validateCreateTask, taskController.createTask)
  .get(taskController.getTasks);

router
  .route("/:id")
  .put(validateUpdateTask, taskController.updateTask)
  .delete(taskController.deleteTask);

router.put("/:id/assign", validateAssignTask, taskController.assignTask);
router.put("/:id/status", validateChangeStatus, taskController.changeStatus);

// Comments and Attachments sub-routes
router.route("/:id/comments")
  .get(taskController.getComments)
  .post(taskController.createComment);

router.route("/:id/attachments")
  .get(taskController.getAttachments)
  .post(taskController.createAttachment);

module.exports = router;
