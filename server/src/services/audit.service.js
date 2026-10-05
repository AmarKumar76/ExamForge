const AuditLog = require('../models/AuditLog');
const SystemLog = require('../models/SystemLog');
const User = require('../models/User');
const Course = require('../models/Course');
const Institution = require('../models/Institution');
const { ROLES } = require('../constants/roles');

class AuditService {
  /**
   * Log an administrative audit action
   */
  async logAudit({ user, action, resourceType, resourceId = '', institutionId = null, metadata = {} }) {
    try {
      if (!user) return null;

      // Sanitize metadata to never record sensitive fields
      const safeMetadata = { ...metadata };
      delete safeMetadata.password;
      delete safeMetadata.passwordHash;
      delete safeMetadata.token;
      delete safeMetadata.apiKey;

      return await AuditLog.create({
        actorId: user._id,
        actorName: user.name || user.email,
        actorRole: user.role,
        action,
        resourceType,
        resourceId: String(resourceId),
        institutionId: institutionId || user.institutionId || null,
        metadata: safeMetadata,
      });
    } catch (err) {
      console.error('Failed to create audit log entry:', err.message);
      return null;
    }
  }

  /**
   * Log a system operation event
   */
  async logSystem({ level = 'INFO', event, module, message, user = null, status = 'SUCCESS', metadata = {} }) {
    try {
      const safeMetadata = { ...metadata };
      delete safeMetadata.password;
      delete safeMetadata.passwordHash;
      delete safeMetadata.token;
      delete safeMetadata.apiKey;

      return await SystemLog.create({
        level,
        event,
        module,
        message,
        userId: user ? user._id : null,
        userRole: user ? user.role : '',
        status,
        metadata: safeMetadata,
      });
    } catch (err) {
      console.error('Failed to create system log entry:', err.message);
      return null;
    }
  }

  /**
   * Retrieve audit logs with filtering and role scoping
   */
  async getAuditLogs(user, filters = {}) {
    const query = {};

    if (user.role === ROLES.INSTITUTION_ADMIN) {
      if (user.institutionId) {
        query.institutionId = user.institutionId;
      }
    }

    if (filters.action) {
      query.action = new RegExp(filters.action, 'i');
    }
    if (filters.resourceType) {
      query.resourceType = filters.resourceType;
    }
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { actorName: searchRegex },
        { action: searchRegex },
        { resourceType: searchRegex },
      ];
    }

    const logs = await AuditLog.find(query)
      .populate('actorId', 'name email role')
      .populate('institutionId', 'name code')
      .sort({ createdAt: -1 })
      .limit(200);

    return logs;
  }

  /**
   * Retrieve system logs with filtering
   */
  async getSystemLogs(user, filters = {}) {
    const query = {};

    if (filters.level) {
      query.level = filters.level.toUpperCase();
    }
    if (filters.module) {
      query.module = new RegExp(filters.module, 'i');
    }
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { event: searchRegex },
        { message: searchRegex },
        { module: searchRegex },
      ];
    }

    const logs = await SystemLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);

    return logs;
  }

  /**
   * Compute real database analytics for Admin Workspace
   */
  async getAdminAnalytics(user) {
    let instQuery = {};
    let courseQuery = {};
    let userQuery = {};

    if (user.role === ROLES.INSTITUTION_ADMIN && user.institutionId) {
      instQuery._id = user.institutionId;
      courseQuery.institutionId = user.institutionId;
      userQuery.institutionId = user.institutionId;
    }

    const [
      totalInstitutions,
      totalCourses,
      activeCourses,
      totalUsers,
      totalInstructors,
      totalStudents,
      courses,
    ] = await Promise.all([
      Institution.countDocuments(instQuery),
      Course.countDocuments(courseQuery),
      Course.countDocuments({ ...courseQuery, status: 'ACTIVE' }),
      User.countDocuments(userQuery),
      User.countDocuments({ ...userQuery, role: ROLES.INSTRUCTOR }),
      User.countDocuments({ ...userQuery, role: ROLES.STUDENT }),
      Course.find(courseQuery)
        .populate('instructorIds', 'name email')
        .select('name code department studentIds instructorIds status')
        .sort({ createdAt: -1 }),
    ]);

    const courseBreakdown = courses.map((c) => ({
      id: c._id,
      code: c.code,
      name: c.name,
      department: c.department,
      status: c.status,
      studentCount: c.studentIds ? c.studentIds.length : 0,
      instructors: c.instructorIds ? c.instructorIds.map((inst) => inst.name || inst.email).join(', ') : 'Unassigned',
    }));

    return {
      stats: {
        totalInstitutions,
        totalCourses,
        activeCourses,
        totalUsers,
        totalInstructors,
        totalStudents,
      },
      courseBreakdown,
    };
  }
}

module.exports = new AuditService();
