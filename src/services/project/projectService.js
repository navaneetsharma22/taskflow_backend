const Project = require("../../models/Project");
const User = require("../../models/User");

class ProjectService {
  /**
   * Create a new project within the organization
   */
  async createProject(projectData) {
    // If members are provided, verify they all exist in the active organization context
    if (projectData.members && projectData.members.length > 0) {
      const userCount = await User.countDocuments({
        _id: { $in: projectData.members },
      });

      if (userCount !== projectData.members.length) {
        const error = new Error("One or more specified project members do not exist in this organization");
        error.statusCode = 404;
        throw error;
      }
    }

    // Create the project (organizationId is automatically set by the tenant plugin)
    const project = await Project.create(projectData);
    return project;
  }

  /**
   * Get all projects of the organization with advanced filtering and pagination
   */
  async getProjects(queryParams) {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      status,
      memberId,
      search,
    } = queryParams;

    // Build query conditions
    const queryConditions = {};

    if (status) {
      queryConditions.status = status;
    }

    if (memberId) {
      // Find projects where the array of members includes memberId
      queryConditions.members = memberId;
    }

    if (search) {
      queryConditions.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination calculations
    const skipCount = (parseInt(page) - 1) * parseInt(limit);

    // Run query (multi-tenant filtering is automatically applied)
    const projectsQuery = Project.find(queryConditions)
      .populate("members", "name email role")
      .sort(sort)
      .skip(skipCount)
      .limit(parseInt(limit));

    const totalDocs = await Project.countDocuments(queryConditions);
    const projects = await projectsQuery;

    return {
      projects,
      pagination: {
        total: totalDocs,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalDocs / parseInt(limit)),
      },
    };
  }

  /**
   * Update a project
   */
  async updateProject(projectId, updateData) {
    // If members are updated, verify they all exist in the active organization context
    if (updateData.members && updateData.members.length > 0) {
      const userCount = await User.countDocuments({
        _id: { $in: updateData.members },
      });

      if (userCount !== updateData.members.length) {
        const error = new Error("One or more specified project members do not exist in this organization");
        error.statusCode = 404;
        throw error;
      }
    }

    // Update project (automatically scoped to current organization context)
    const project = await Project.findByIdAndUpdate(projectId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      const error = new Error("Project not found");
      error.statusCode = 404;
      throw error;
    }

    return project;
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId) {
    // Scoped deletion (automatically filtered)
    const project = await Project.findByIdAndDelete(projectId);
    if (!project) {
      const error = new Error("Project not found");
      error.statusCode = 404;
      throw error;
    }
    return project;
  }
}

module.exports = new ProjectService();
