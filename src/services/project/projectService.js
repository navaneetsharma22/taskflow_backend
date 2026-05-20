const Project = require("../../models/Project");
const User = require("../../models/User");
const { escapeRegex } = require("../../utils/sanitize");

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

    // HIGH-4: Whitelist allowed fields
    const project = await Project.create({
      title: projectData.title,
      description: projectData.description,
      status: projectData.status,
      members: projectData.members,
    });

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
      // HIGH-2: Escape regex special characters to prevent ReDoS
      const safeSearch = escapeRegex(search);
      queryConditions.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Pagination calculations
    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = Math.min(parseInt(limit) || 10, 100);

    // PERF-1: Run count + find in parallel
    const [totalDocs, projects] = await Promise.all([
      Project.countDocuments(queryConditions),
      Project.find(queryConditions)
        .populate("members", "name email role")
        .sort(sort)
        .skip(skipCount)
        .limit(parsedLimit),
    ]);

    return {
      projects,
      pagination: {
        total: totalDocs,
        page: parseInt(page),
        limit: parsedLimit,
        pages: Math.ceil(totalDocs / parsedLimit),
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

    // HIGH-4: Whitelist allowed update fields
    const allowedFields = {};
    const whitelist = ["title", "description", "status", "members"];
    for (const key of whitelist) {
      if (updateData[key] !== undefined) {
        allowedFields[key] = updateData[key];
      }
    }

    // Update project (automatically scoped to current organization context)
    const project = await Project.findByIdAndUpdate(projectId, allowedFields, {
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
