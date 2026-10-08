const AuditLog = require('../models/AuditLog');
const SystemLog = require('../models/SystemLog');
const User = require('../models/User');
const Course = require('../models/Course');
const Institution = require('../models/Institution');
const { ROLES } = require('../constants/roles');

class AuditService {
  /**
   * Helper to recursively redact sensitive fields from metadata objects
   */
  redactSecrets(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.redactSecrets(item));

    const sensitiveKeys = [
      'password',
      'passwordhash',
      'password_hash',
      'token',
      'accesstoken',
      'refreshtoken',
      'jwt',
      'apikey',
      'api_key',
      'authorization',
      'secret',
      'cookie',
      'mongouri',
      'mongo_uri',
      'gemini_api_key',
      'bearer',
    ];

    const redacted = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactSecrets(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  /**
   * Log an administrative or operational audit action
   */
  async logAudit({
    user = null,
    actor = null,
    action,
    resourceType,
    resourceId = '',
    resourceName = '',
    courseId = null,
    folderId = '',
    institutionId = null,
    status = 'SUCCESS',
    ipAddress = '',
    userAgent = '',
    metadata = {},
    req = null,
  }) {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        return null;
      }

      const effectiveUser = user || actor || (req ? req.user : null);
      const safeMetadata = this.redactSecrets(metadata);

      const effectiveIp = ipAddress || (req ? req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '' : '');
      const effectiveUserAgent = userAgent || (req ? req.headers['user-agent'] || '' : '');

      return await AuditLog.create({
        actorId: effectiveUser ? effectiveUser._id || effectiveUser.id : null,
        actorName: effectiveUser ? effectiveUser.name || effectiveUser.email : 'System',
        actorRole: effectiveUser ? effectiveUser.role : 'SYSTEM',
        action,
        resourceType,
        resourceId: String(resourceId || ''),
        resourceName: String(resourceName || ''),
        courseId: courseId || (effectiveUser ? effectiveUser.courseId : null) || null,
        folderId: String(folderId || ''),
        institutionId: institutionId || (effectiveUser ? effectiveUser.institutionId : null) || null,
        status: ['SUCCESS', 'FAILED', 'DENIED'].includes(status) ? status : 'SUCCESS',
        ipAddress: String(effectiveIp || ''),
        userAgent: String(effectiveUserAgent || ''),
        metadata: safeMetadata,
      });
    } catch (err) {
      console.error('Failed to create audit log entry:', err.message);
      return null;
    }
  }

  /**
   * Log a technical system event
   */
  async logSystem({
    level = 'INFO',
    service = 'API',
    module: moduleName = 'SYSTEM',
    event,
    message,
    user = null,
    status = 'SUCCESS',
    requestId = '',
    stackTrace = '',
    metadata = {},
  }) {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 1) {
        return null;
      }

      const safeMetadata = this.redactSecrets(metadata);

      return await SystemLog.create({
        level: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'].includes(level) ? level : 'INFO',
        service: String(service || 'API'),
        module: String(moduleName || 'SYSTEM'),
        event: String(event || 'SYSTEM_EVENT'),
        message: String(message || ''),
        userId: user ? user._id || user.id : null,
        userRole: user ? user.role : '',
        status: ['SUCCESS', 'FAILED', 'PENDING'].includes(status) ? status : 'SUCCESS',
        requestId: String(requestId || ''),
        stackTrace: String(stackTrace || ''),
        metadata: safeMetadata,
      });
    } catch (err) {
      console.error('Failed to create system log entry:', err.message);
      return null;
    }
  }

  /**
   * Retrieve audit logs with server-side filtering, institution scoping, and pagination
   */
  async getAuditLogs(user, filters = {}) {
    const query = {};

    // Institution scoping
    if (user.role === ROLES.INSTITUTION_ADMIN) {
      if (user.institutionId) {
        query.institutionId = user.institutionId;
      }
    } else if (filters.institutionId) {
      query.institutionId = filters.institutionId;
    }

    if (filters.role) {
      query.actorRole = filters.role.toUpperCase();
    }
    if (filters.action) {
      query.action = new RegExp(filters.action, 'i');
    }
    if (filters.status) {
      query.status = filters.status.toUpperCase();
    }
    if (filters.courseId) {
      query.courseId = filters.courseId;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { actorName: searchRegex },
        { action: searchRegex },
        { resourceType: searchRegex },
        { resourceName: searchRegex },
        { resourceId: searchRegex },
      ];
    }

    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const countsQuery = user.role === ROLES.INSTITUTION_ADMIN && user.institutionId ? { institutionId: user.institutionId } : {};

    const [logs, total, totalSystemCount] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'name email role')
        .populate('institutionId', 'name code')
        .populate('courseId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
      SystemLog.countDocuments(),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      totalAuditCount: total,
      totalSystemCount,
    };
  }

  /**
   * Retrieve system logs with server-side filtering and pagination
   */
  async getSystemLogs(user, filters = {}) {
    const query = {};

    if (filters.level && filters.level !== 'ALL') {
      query.level = filters.level.toUpperCase();
    }
    if (filters.service) {
      query.service = new RegExp(filters.service, 'i');
    }
    if (filters.status) {
      query.status = filters.status.toUpperCase();
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { event: searchRegex },
        { message: searchRegex },
        { service: searchRegex },
        { module: searchRegex },
      ];
    }

    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 25));
    const skip = (page - 1) * limit;

    const auditCountsQuery = user.role === ROLES.INSTITUTION_ADMIN && user.institutionId ? { institutionId: user.institutionId } : {};

    const [logs, total, totalAuditCount] = await Promise.all([
      SystemLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SystemLog.countDocuments(query),
      AuditLog.countDocuments(auditCountsQuery),
    ]);

    // Redact stack trace if user is not SUPER_ADMIN
    const safeLogs = logs.map((log) => {
      const l = log.toObject();
      if (user.role !== ROLES.SUPER_ADMIN) {
        delete l.stackTrace;
      }
      return l;
    });

    return {
      logs: safeLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      totalAuditCount,
      totalSystemCount: total,
    };
  }

  /**
   * Get log counts
   */
  async getLogCounts(user) {
    const auditQuery = user.role === ROLES.INSTITUTION_ADMIN && user.institutionId ? { institutionId: user.institutionId } : {};

    const [auditCount, systemCount] = await Promise.all([
      AuditLog.countDocuments(auditQuery),
      SystemLog.countDocuments(),
    ]);

    return {
      auditCount,
      systemCount,
    };
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
      superAdmins,
      institutionAdmins,
      systemAlertsCount,
      courses,
      recentUsers,
    ] = await Promise.all([
      Institution.countDocuments(instQuery),
      Course.countDocuments(courseQuery),
      Course.countDocuments({ ...courseQuery, status: 'ACTIVE' }),
      User.countDocuments(userQuery),
      User.countDocuments({ ...userQuery, role: ROLES.INSTRUCTOR }),
      User.countDocuments({ ...userQuery, role: ROLES.STUDENT }),
      User.countDocuments({ ...userQuery, role: ROLES.SUPER_ADMIN }),
      User.countDocuments({ ...userQuery, role: ROLES.INSTITUTION_ADMIN }),
      SystemLog.countDocuments({ level: { $in: ['WARNING', 'ERROR', 'CRITICAL'] } }),
      Course.find(courseQuery)
        .populate('instructorIds', 'name email')
        .select('name code department studentIds instructorIds status')
        .sort({ createdAt: -1 }),
      User.find(userQuery)
        .select('name email role createdAt status')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const courseBreakdown = courses.map((c) => ({
      id: c._id,
      code: c.code,
      name: c.name,
      department: c.department,
      status: c.status,
      studentCount: c.studentIds ? c.studentIds.length : 0,
      instructors: c.instructorIds && c.instructorIds.length > 0 ? c.instructorIds.map((inst) => inst.name || inst.email).join(', ') : 'Unassigned',
    }));

    return {
      stats: {
        totalInstitutions,
        totalCourses,
        activeCourses,
        totalUsers,
        totalInstructors,
        totalStudents,
        superAdmins,
        institutionAdmins,
        systemAlertsCount,
      },
      recentUsers,
      courseBreakdown,
    };
  }
}

module.exports = new AuditService();
