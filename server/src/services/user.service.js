const User = require('../models/User');
const Course = require('../models/Course');
const Institution = require('../models/Institution');
const { hashPassword } = require('../utils/password');
const { ROLES, ACCOUNT_STATUS } = require('../constants/roles');
const auditService = require('./audit.service');

class UserService {
  /**
   * List users with role filtering, search, status, and populated course details
   */
  async getUsers(currentUser, filters = {}) {
    let query = {};

    // Scoping by institution for INSTITUTION_ADMIN
    if (currentUser.role === ROLES.INSTITUTION_ADMIN) {
      if (currentUser.institutionId) {
        query.institutionId = currentUser.institutionId;
      }
    } else if (filters.institutionId) {
      query.institutionId = filters.institutionId;
    }

    if (filters.role && Object.values(ROLES).includes(filters.role)) {
      query.role = filters.role;
    }

    if (filters.status && Object.values(ACCOUNT_STATUS).includes(filters.status)) {
      query.status = filters.status;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const users = await User.find(query)
      .populate('institutionId', 'name code')
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    // Fetch all courses in bulk to populate course assignments/enrollments efficiently
    const userIds = users.map((u) => u._id);
    const courses = await Course.find({
      $or: [{ instructorIds: { $in: userIds } }, { studentIds: { $in: userIds } }],
    })
      .populate('instructorIds', 'name email')
      .select('name code department instructorIds studentIds status');

    // Attach user course details
    const populatedUsers = users.map((u) => {
      const userObj = u.toJSON();
      if (u.role === ROLES.INSTRUCTOR) {
        userObj.assignedCourses = courses
          .filter((c) => c.instructorIds.some((inst) => inst._id ? inst._id.toString() === u._id.toString() : inst.toString() === u._id.toString()))
          .map((c) => ({
            id: c._id,
            code: c.code,
            name: c.name,
            department: c.department,
            studentCount: c.studentIds ? c.studentIds.length : 0,
            status: c.status,
          }));
        userObj.totalStudentsAcrossCourses = userObj.assignedCourses.reduce((acc, curr) => acc + curr.studentCount, 0);
      } else if (u.role === ROLES.STUDENT) {
        userObj.enrolledCourses = courses
          .filter((c) => c.studentIds.some((stud) => stud.toString() === u._id.toString()))
          .map((c) => ({
            id: c._id,
            code: c.code,
            name: c.name,
            department: c.department,
            assignedInstructors: c.instructorIds.map((inst) => inst.name || inst.email).join(', ') || 'Unassigned',
            status: c.status,
          }));
      }
      return userObj;
    });

    return populatedUsers;
  }

  /**
   * Get single user detailed profile
   */
  async getUserById(userId, currentUser) {
    const user = await User.findById(userId).populate('institutionId', 'name code departments').select('-passwordHash');
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (currentUser.role === ROLES.INSTITUTION_ADMIN) {
      if (currentUser.institutionId && user.institutionId && user.institutionId._id.toString() !== currentUser.institutionId.toString()) {
        const error = new Error('Access denied. User belongs to a different institution.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_INSTITUTION';
        throw error;
      }
    }

    const userObj = user.toJSON();

    if (user.role === ROLES.INSTRUCTOR) {
      const assignedCourses = await Course.find({ instructorIds: user._id })
        .populate('studentIds', 'name email status')
        .select('name code department studentIds status');

      userObj.assignedCourses = assignedCourses.map((c) => ({
        id: c._id,
        code: c.code,
        name: c.name,
        department: c.department,
        studentCount: c.studentIds ? c.studentIds.length : 0,
        status: c.status,
      }));
      userObj.totalStudentsAcrossCourses = userObj.assignedCourses.reduce((acc, curr) => acc + curr.studentCount, 0);
    } else if (user.role === ROLES.STUDENT) {
      const enrolledCourses = await Course.find({ studentIds: user._id })
        .populate('instructorIds', 'name email')
        .select('name code department instructorIds status');

      userObj.enrolledCourses = enrolledCourses.map((c) => ({
        id: c._id,
        code: c.code,
        name: c.name,
        department: c.department,
        assignedInstructors: c.instructorIds.map((inst) => inst.name || inst.email).join(', ') || 'Unassigned',
        status: c.status,
      }));
    }

    return userObj;
  }

  /**
   * Create a new user (Instructor or Student) by Admin
   */
  async createUser({ name, email, password, role, institutionId }, currentUser) {
    const cleanEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      const error = new Error('User email already exists.');
      error.statusCode = 409;
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }

    let targetInstId = institutionId;
    if (currentUser.role === ROLES.INSTITUTION_ADMIN) {
      targetInstId = currentUser.institutionId;
    }

    if (targetInstId) {
      const inst = await Institution.findById(targetInstId);
      if (!inst) {
        const error = new Error('Specified institution not found.');
        error.statusCode = 404;
        error.code = 'INSTITUTION_NOT_FOUND';
        throw error;
      }
    }

    const passwordHash = await hashPassword(password || 'ExamForge@123');

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: Object.values(ROLES).includes(role) ? role : ROLES.STUDENT,
      institutionId: targetInstId || null,
      status: ACCOUNT_STATUS.ACTIVE,
    });

    await auditService.logAudit({
      user: currentUser,
      action: 'USER_CREATED',
      resourceType: 'USER',
      resourceId: newUser._id,
      institutionId: targetInstId,
      metadata: { createdUserEmail: cleanEmail, createdUserRole: role },
    });

    await auditService.logSystem({
      level: 'INFO',
      event: 'USER_ACCOUNT_CREATED',
      module: 'USER_MANAGEMENT',
      message: `Admin ${currentUser.email} created user ${cleanEmail} (${role})`,
      user: currentUser,
    });

    return User.findById(newUser._id).populate('institutionId', 'name code').select('-passwordHash');
  }

  /**
   * Update user status (Active / Suspended)
   */
  async updateUserStatus(userId, status, currentUser) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (currentUser.role === ROLES.INSTITUTION_ADMIN) {
      if (currentUser.institutionId && user.institutionId && user.institutionId.toString() !== currentUser.institutionId.toString()) {
        const error = new Error('Access denied. User belongs to a different institution.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_INSTITUTION';
        throw error;
      }
    }

    if (Object.values(ACCOUNT_STATUS).includes(status)) {
      user.status = status;
      await user.save();

      await auditService.logAudit({
        user: currentUser,
        action: `USER_STATUS_${status}`,
        resourceType: 'USER',
        resourceId: user._id,
        institutionId: user.institutionId,
        metadata: { targetUserEmail: user.email, newStatus: status },
      });
    }

    return User.findById(user._id).populate('institutionId', 'name code').select('-passwordHash');
  }
}

module.exports = new UserService();
