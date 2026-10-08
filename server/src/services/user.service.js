const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const Course = require('../models/Course');
const Institution = require('../models/Institution');
const Notification = require('../models/Notification');
const { hashPassword } = require('../utils/password');
const { ROLES, ACCOUNT_STATUS } = require('../constants/roles');
const auditService = require('./audit.service');
const emailService = require('./email.service');

class UserService {
  /**
   * Helper to assign courses to user (Instructors or Students)
   */
  async assignCoursesToUser(userId, role, courseIds = [], courseCodes = [], institutionId = null) {
    if ((!courseIds || courseIds.length === 0) && (!courseCodes || courseCodes.length === 0)) {
      return [];
    }

    const queryOr = [];
    if (Array.isArray(courseIds) && courseIds.length > 0) {
      const validIds = courseIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length > 0) {
        queryOr.push({ _id: { $in: validIds } });
      }
    }

    if (Array.isArray(courseCodes) && courseCodes.length > 0) {
      const cleanCodes = courseCodes.map((c) => String(c).trim().toUpperCase()).filter(Boolean);
      if (cleanCodes.length > 0) {
        queryOr.push({ code: { $in: cleanCodes } });
      }
    }

    if (queryOr.length === 0) {
      return [];
    }

    const courseQuery = { $or: queryOr };
    if (institutionId) {
      courseQuery.institutionId = institutionId;
    }

    const courses = await Course.find(courseQuery);

    for (const course of courses) {
      if (role === ROLES.INSTRUCTOR) {
        if (!course.instructorIds.some((id) => id.toString() === userId.toString())) {
          course.instructorIds.push(userId);
          await course.save();
        }
      } else if (role === ROLES.STUDENT) {
        if (!course.studentIds.some((id) => id.toString() === userId.toString())) {
          course.studentIds.push(userId);
          await course.save();
        }
      }
    }

    return courses;
  }

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
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { enrollmentNumber: searchRegex },
        { rollNumber: searchRegex },
        { employeeId: searchRegex },
        { department: searchRegex },
      ];
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
      const userObj = typeof u.toSafeObject === 'function' ? u.toSafeObject() : u.toJSON();
      userObj.institutionId = u.institutionId;

      if (u.role === ROLES.INSTRUCTOR) {
        userObj.assignedCourses = courses
          .filter((c) =>
            c.instructorIds.some((inst) => (inst._id ? inst._id.toString() === u._id.toString() : inst.toString() === u._id.toString()))
          )
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

    const userObj = typeof user.toSafeObject === 'function' ? user.toSafeObject() : user.toJSON();
    userObj.institutionId = user.institutionId;

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
  async createUser(userData = {}, currentUser) {
    const {
      name,
      email,
      password,
      role = ROLES.STUDENT,
      institutionId,
      department,
      enrollmentNumber,
      rollNumber,
      semester,
      batch,
      employeeId,
      courseIds = [],
      courseCodes = [],
    } = userData;

    if (!name || typeof name !== 'string' || !name.trim()) {
      const error = new Error('Full name is required.');
      error.statusCode = 400;
      error.code = 'INVALID_NAME';
      throw error;
    }

    const cleanEmail = String(email || '').toLowerCase().trim();
    if (!cleanEmail) {
      const error = new Error('Email address is required.');
      error.statusCode = 400;
      error.code = 'INVALID_EMAIL';
      throw error;
    }

    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      const error = new Error(`An account with email '${cleanEmail}' already exists.`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }

    const cleanEnrollment = enrollmentNumber ? String(enrollmentNumber).trim() : null;
    if (cleanEnrollment) {
      const existingEnrollment = await User.findOne({ enrollmentNumber: cleanEnrollment });
      if (existingEnrollment) {
        const error = new Error(`Enrollment Number '${cleanEnrollment}' is already assigned to another student.`);
        error.statusCode = 409;
        error.code = 'DUPLICATE_ENROLLMENT';
        throw error;
      }
    }

    const cleanRoll = rollNumber ? String(rollNumber).trim() : null;
    if (cleanRoll) {
      const existingRoll = await User.findOne({ rollNumber: cleanRoll });
      if (existingRoll) {
        const error = new Error(`Roll Number '${cleanRoll}' is already assigned to another student.`);
        error.statusCode = 409;
        error.code = 'DUPLICATE_ROLL';
        throw error;
      }
    }

    const cleanEmpId = employeeId ? String(employeeId).trim() : null;
    if (cleanEmpId) {
      const existingEmpId = await User.findOne({ employeeId: cleanEmpId });
      if (existingEmpId) {
        const error = new Error(`Employee ID '${cleanEmpId}' is already assigned to another instructor.`);
        error.statusCode = 409;
        error.code = 'DUPLICATE_EMPLOYEE_ID';
        throw error;
      }
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

    const passwordHash = await hashPassword(password || (role === ROLES.INSTRUCTOR ? 'Instructor@123' : 'Student@123'));
    const targetRole = Object.values(ROLES).includes(role) ? role : ROLES.STUDENT;

    const userPayload = {
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: targetRole,
      institutionId: targetInstId || null,
      department: department ? department.trim() : '',
      semester: semester ? String(semester).trim() : '',
      batch: batch ? String(batch).trim() : '',
      status: ACCOUNT_STATUS.ACTIVE,
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    };

    if (cleanEnrollment) userPayload.enrollmentNumber = cleanEnrollment;
    if (cleanRoll) userPayload.rollNumber = cleanRoll;
    if (cleanEmpId) userPayload.employeeId = cleanEmpId;

    const newUser = await User.create(userPayload);

    // Send Welcome Email (Direct access without email verification link)
    let emailResult;
    if (targetRole === ROLES.INSTRUCTOR) {
      emailResult = await emailService.sendInstructorWelcomeEmail({
        to: cleanEmail,
        name: name.trim(),
        tempPassword: password || 'Instructor@123',
      });
    } else if (targetRole === ROLES.STUDENT) {
      emailResult = await emailService.sendStudentWelcomeEmail({
        to: cleanEmail,
        name: name.trim(),
        tempPassword: password || 'Student@123',
      });
    } else {
      emailResult = await emailService.sendAdminWelcomeEmail({
        to: cleanEmail,
        name: name.trim(),
        tempPassword: password || null,
      });
    }

    // Record Notification delivery status
    await Notification.create({
      studentId: newUser._id,
      recipientEmail: cleanEmail,
      type: 'WELCOME_EMAIL',
      title: `Welcome to ExamForge — ${targetRole} Account`,
      message: emailResult.success ? `Welcome email sent to ${cleanEmail}` : `Failed to send welcome email to ${cleanEmail}`,
      status: emailResult.success ? 'SENT' : 'FAILED',
      failureReason: emailResult.error || null,
    });

    await auditService.logAudit({
      user: currentUser,
      action: 'USER_CREATED',
      resourceType: 'USER',
      resourceId: newUser._id,
      institutionId: targetInstId,
      metadata: { createdUserEmail: cleanEmail, createdUserRole: targetRole, emailDeliverySuccess: emailResult.success },
    });

    const userObj = await this.getUserById(newUser._id, currentUser);
    return {
      user: userObj,
      welcomeEmailSent: emailResult.success,
      emailError: emailResult.success ? null : (emailResult.error || 'SMTP email delivery is not configured.'),
      message: emailResult.success
        ? `${targetRole} account created and welcome email sent.`
        : `${targetRole} account created, but welcome email could not be sent.`,
    };
  }

  /**
   * Bulk import users from parsed CSV/XLSX records
   */
  async bulkImportUsers({ records = [], role = ROLES.STUDENT, institutionId }, currentUser) {
    if (!Array.isArray(records) || records.length === 0) {
      const error = new Error('Import data is empty or invalid.');
      error.statusCode = 400;
      error.code = 'INVALID_IMPORT_DATA';
      throw error;
    }

    let targetInstId = institutionId;
    if (currentUser.role === ROLES.INSTITUTION_ADMIN) {
      targetInstId = currentUser.institutionId;
    }

    const targetRole = [ROLES.STUDENT, ROLES.INSTRUCTOR].includes(role) ? role : ROLES.STUDENT;

    const summary = {
      totalRows: records.length,
      successCount: 0,
      failedCount: 0,
      duplicateCount: 0,
      invalidCount: 0,
      emailSentCount: 0,
      emailFailedCount: 0,
      createdUsers: [],
      failedRows: [],
    };

    const seenEmails = new Set();
    const seenEnrollments = new Set();
    const seenRollNumbers = new Set();
    const seenEmployeeIds = new Set();

    for (let index = 0; index < records.length; index++) {
      const rowNum = index + 1;
      const rec = records[index] || {};

      const name = rec.Name || rec['Full Name'] || rec.name || '';
      const email = rec.Email || rec['College Email'] || rec.email || '';
      const enrollmentNumber = rec['Enrollment No'] || rec['Enrollment Number'] || rec.enrollmentNumber || null;
      const rollNumber = rec['Roll No'] || rec['Roll Number'] || rec.rollNumber || null;
      const employeeId = rec['Employee ID'] || rec['EmployeeId'] || rec.employeeId || null;
      const department = rec.Department || rec.department || '';
      const semester = rec.Semester || rec.semester || '';
      const batch = rec.Batch || rec.batch || '';

      if (!name || !String(name).trim()) {
        summary.failedCount++;
        summary.invalidCount++;
        summary.failedRows.push({ rowNumber: rowNum, name: name || 'N/A', email: email || 'N/A', field: 'Name', reason: 'Name is required' });
        continue;
      }

      const cleanEmail = String(email || '').toLowerCase().trim();
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        summary.failedCount++;
        summary.invalidCount++;
        summary.failedRows.push({ rowNumber: rowNum, name, email: cleanEmail || 'N/A', field: 'Email', reason: 'Invalid or missing email address' });
        continue;
      }

      if (seenEmails.has(cleanEmail)) {
        summary.failedCount++;
        summary.duplicateCount++;
        summary.failedRows.push({ rowNumber: rowNum, name, email: cleanEmail, field: 'Email', reason: 'Duplicate email entry within import file' });
        continue;
      }
      seenEmails.add(cleanEmail);

      const cleanEnrollment = enrollmentNumber ? String(enrollmentNumber).trim() : null;
      if (cleanEnrollment) {
        if (seenEnrollments.has(cleanEnrollment)) {
          summary.failedCount++;
          summary.duplicateCount++;
          summary.failedRows.push({ rowNumber: rowNum, name, email: cleanEmail, field: 'Enrollment No', reason: 'Duplicate Enrollment No within import file' });
          continue;
        }
        seenEnrollments.add(cleanEnrollment);
      }

      const cleanRoll = rollNumber ? String(rollNumber).trim() : null;
      if (cleanRoll) {
        if (seenRollNumbers.has(cleanRoll)) {
          summary.failedCount++;
          summary.duplicateCount++;
          summary.failedRows.push({ rowNumber: rowNum, name, email: cleanEmail, field: 'Roll No', reason: 'Duplicate Roll No within import file' });
          continue;
        }
        seenRollNumbers.add(cleanRoll);
      }

      const cleanEmpId = employeeId ? String(employeeId).trim() : null;
      if (cleanEmpId) {
        if (seenEmployeeIds.has(cleanEmpId)) {
          summary.failedCount++;
          summary.duplicateCount++;
          summary.failedRows.push({ rowNumber: rowNum, name, email: cleanEmail, field: 'Employee ID', reason: 'Duplicate Employee ID within import file' });
          continue;
        }
        seenEmployeeIds.add(cleanEmpId);
      }

      try {
        let existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
          summary.failedCount++;
          summary.duplicateCount++;
          summary.failedRows.push({
            rowNumber: rowNum,
            name,
            email: cleanEmail,
            field: 'Email',
            reason: `Account with email '${cleanEmail}' already exists in database`,
          });
          continue;
        }

        if (cleanEnrollment) {
          const dup = await User.findOne({ enrollmentNumber: cleanEnrollment });
          if (dup) {
            summary.failedCount++;
            summary.duplicateCount++;
            summary.failedRows.push({ rowNumber: rowNum, name, email: cleanEmail, field: 'Enrollment No', reason: `Enrollment No '${cleanEnrollment}' already exists in database` });
            continue;
          }
        }

        if (cleanRoll) {
          const dup = await User.findOne({ rollNumber: cleanRoll });
          if (dup) {
            summary.failedCount++;
            summary.duplicateCount++;
            summary.failedRows.push({ rowNumber: rowNum, name, email: cleanEmail, field: 'Roll No', reason: `Roll No '${cleanRoll}' already exists in database` });
            continue;
          }
        }

        if (cleanEmpId) {
          const dup = await User.findOne({ employeeId: cleanEmpId });
          if (dup) {
            summary.failedCount++;
            summary.duplicateCount++;
            summary.failedRows.push({ rowNumber: rowNum, name, email: cleanEmail, field: 'Employee ID', reason: `Employee ID '${cleanEmpId}' already exists in database` });
            continue;
          }
        }

        const tempPassword = targetRole === ROLES.INSTRUCTOR ? 'Instructor@123' : 'Student@123';
        const passwordHash = await hashPassword(tempPassword);

        const userPayload = {
          name: String(name).trim(),
          email: cleanEmail,
          passwordHash,
          role: targetRole,
          institutionId: targetInstId || null,
          department: department ? String(department).trim() : '',
          semester: semester ? String(semester).trim() : '',
          batch: batch ? String(batch).trim() : '',
          status: ACCOUNT_STATUS.ACTIVE,
          isVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
        };

        if (cleanEnrollment) userPayload.enrollmentNumber = cleanEnrollment;
        if (cleanRoll) userPayload.rollNumber = cleanRoll;
        if (cleanEmpId) userPayload.employeeId = cleanEmpId;

        const createdUser = await User.create(userPayload);

        // Dispatch Welcome Email
        let emailResult;
        if (targetRole === ROLES.INSTRUCTOR) {
          emailResult = await emailService.sendInstructorWelcomeEmail({ to: cleanEmail, name: String(name).trim(), tempPassword });
        } else {
          emailResult = await emailService.sendStudentWelcomeEmail({ to: cleanEmail, name: String(name).trim(), tempPassword });
        }

        if (emailResult.success) {
          summary.emailSentCount++;
        } else {
          summary.emailFailedCount++;
        }

        summary.successCount++;
        summary.createdUsers.push({
          id: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          welcomeEmailSent: emailResult.success,
        });
      } catch (err) {
        summary.failedCount++;
        summary.failedRows.push({ rowNumber: rowNum, name, email: cleanEmail, reason: err.message });
      }
    }

    return summary;
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

    return this.getUserById(user._id, currentUser);
  }

  /**
   * Update self user profile (name, phone, department)
   */
  async updateProfile(userId, { name, phone, department }) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (department !== undefined) user.department = department.trim();

    await user.save();

    await auditService.logAudit({
      user,
      action: 'PROFILE_UPDATED',
      resourceType: 'USER',
      resourceId: user._id,
      institutionId: user.institutionId,
      status: 'SUCCESS',
    });

    return user.toSafeObject();
  }

  /**
   * Change user password securely
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const { comparePassword } = require('../utils/password');
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (!currentPassword || !newPassword) {
      const error = new Error('Both current password and new password are required.');
      error.statusCode = 400;
      error.code = 'MISSING_PASSWORDS';
      throw error;
    }

    if (newPassword.length < 6) {
      const error = new Error('New password must be at least 6 characters long.');
      error.statusCode = 400;
      error.code = 'WEAK_PASSWORD';
      throw error;
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      await auditService.logAudit({
        user,
        action: 'PASSWORD_CHANGED_FAILED',
        resourceType: 'AUTH',
        resourceId: user._id,
        status: 'FAILED',
        metadata: { reason: 'INVALID_CURRENT_PASSWORD' },
      });

      const error = new Error('Current password is incorrect.');
      error.statusCode = 400;
      error.code = 'INVALID_CURRENT_PASSWORD';
      throw error;
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await auditService.logAudit({
      user,
      action: 'PASSWORD_CHANGED',
      resourceType: 'AUTH',
      resourceId: user._id,
      status: 'SUCCESS',
    });

    return { success: true, message: 'Password changed successfully.' };
  }

  /**
   * Update theme & notification preferences
   */
  async updatePreferences(userId, { themePreference, notificationPreferences }) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (themePreference && ['light', 'dark'].includes(themePreference)) {
      user.themePreference = themePreference;
    }

    if (notificationPreferences && typeof notificationPreferences === 'object') {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences,
      };
    }

    await user.save();
    return user.toSafeObject();
  }

  /**
   * Resend welcome email for Admin-provisioned Student or Instructor
   */
  async resendWelcomeEmail(userId, currentUser) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User account not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (currentUser.role === ROLES.INSTITUTION_ADMIN) {
      if (currentUser.institutionId && user.institutionId && user.institutionId.toString() !== currentUser.institutionId.toString()) {
        const error = new Error('Access denied. User belongs to another institution.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_INSTITUTION';
        throw error;
      }
    }

    let emailResult;
    if (user.role === ROLES.INSTRUCTOR) {
      emailResult = await emailService.sendInstructorWelcomeEmail({
        to: user.email,
        name: user.name,
        tempPassword: null,
      });
    } else if (user.role === ROLES.STUDENT) {
      emailResult = await emailService.sendStudentWelcomeEmail({
        to: user.email,
        name: user.name,
        tempPassword: null,
      });
    } else {
      emailResult = await emailService.sendAdminWelcomeEmail({
        to: user.email,
        name: user.name,
        tempPassword: null,
      });
    }

    await Notification.create({
      studentId: user._id,
      recipientEmail: user.email,
      type: 'WELCOME_EMAIL_RESEND',
      title: `ExamForge — Welcome Email Resent`,
      message: emailResult.success ? `Welcome email resent to ${user.email}` : `Failed to resend welcome email to ${user.email}`,
      status: emailResult.success ? 'SENT' : 'FAILED',
      failureReason: emailResult.error || null,
    });

    await auditService.logAudit({
      user: currentUser,
      action: 'WELCOME_EMAIL_RESENT',
      resourceType: 'USER',
      resourceId: user._id,
      institutionId: user.institutionId,
      metadata: { recipientEmail: user.email, role: user.role, success: emailResult.success },
    });

    return {
      success: emailResult.success,
      emailError: emailResult.success ? null : (emailResult.error || 'SMTP email delivery is not configured.'),
      message: emailResult.success
        ? `Welcome email sent successfully to ${user.email}.`
        : `Welcome email could not be sent to ${user.email}: ${emailResult.error || 'SMTP email delivery is not configured.'}`,
    };
  }
}

module.exports = new UserService();
