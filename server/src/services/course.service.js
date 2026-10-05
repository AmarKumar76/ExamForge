const Course = require('../models/Course');
const Institution = require('../models/Institution');
const User = require('../models/User');
const { ROLES } = require('../constants/roles');

class CourseService {
  /**
   * Create a new course
   */
  async createCourse({ institutionId, department, name, code, description, instructorIds = [], studentIds = [] }) {
    const uppercaseCode = code.toUpperCase().trim();

    // Verify institution exists
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      const error = new Error('Institution not found.');
      error.statusCode = 404;
      error.code = 'INSTITUTION_NOT_FOUND';
      throw error;
    }

    // Check duplicate course code within institution
    const existing = await Course.findOne({ institutionId, code: uppercaseCode });
    if (existing) {
      const error = new Error('Course code already exists within this institution.');
      error.statusCode = 409;
      error.code = 'DUPLICATE_COURSE_CODE';
      throw error;
    }

    const course = await Course.create({
      institutionId,
      department: department || 'General',
      name: name.trim(),
      code: uppercaseCode,
      description: description ? description.trim() : '',
      instructorIds,
      studentIds,
      status: 'ACTIVE',
    });

    return course;
  }

  /**
   * Get courses with role-based scoping
   */
  async getCoursesForUser(user, filters = {}) {
    let query = {};

    if (user.role === ROLES.SUPER_ADMIN) {
      if (filters.institutionId) {
        query.institutionId = filters.institutionId;
      }
    } else if (user.role === ROLES.INSTITUTION_ADMIN) {
      if (!user.institutionId) {
        return [];
      }
      query.institutionId = user.institutionId;
    } else if (user.role === ROLES.INSTRUCTOR) {
      query.instructorIds = user._id;
    } else if (user.role === ROLES.STUDENT) {
      if (filters.available === 'true' && user.institutionId) {
        // Return active courses in institution available for enrollment
        query = {
          institutionId: user.institutionId,
          status: 'ACTIVE',
        };
      } else {
        // Return courses student is enrolled in
        query.studentIds = user._id;
      }
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const courses = await Course.find(query)
      .populate('institutionId', 'name code')
      .populate('instructorIds', 'name email avatar')
      .sort({ createdAt: -1 });

    return courses;
  }

  /**
   * Get course details by ID with authorization checks
   */
  async getCourseById(courseId, user) {
    const course = await Course.findById(courseId)
      .populate('institutionId', 'name code departments')
      .populate('instructorIds', 'name email role avatar')
      .populate('studentIds', 'name email role avatar');

    if (!course) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    // Permission checks based on user role
    if (user.role === ROLES.INSTITUTION_ADMIN) {
      if (user.institutionId && course.institutionId._id.toString() !== user.institutionId.toString()) {
        const error = new Error('Access denied. Course belongs to a different institution.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_INSTITUTION';
        throw error;
      }
    } else if (user.role === ROLES.INSTRUCTOR) {
      const isAssigned = course.instructorIds.some((inst) => inst._id.toString() === user._id.toString());
      if (!isAssigned) {
        const error = new Error('You are not assigned to this course.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_COURSE_ACCESS';
        throw error;
      }
    } else if (user.role === ROLES.STUDENT) {
      const isEnrolled = course.studentIds.some((stud) => stud._id.toString() === user._id.toString());
      if (!isEnrolled && course.status !== 'ACTIVE') {
        const error = new Error('Access denied. You are not enrolled in this course.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_COURSE_ACCESS';
        throw error;
      }
    }

    return course;
  }

  /**
   * Update course
   */
  async updateCourse(courseId, updateData, user) {
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    // Role check
    if (user.role === ROLES.INSTITUTION_ADMIN) {
      if (user.institutionId && course.institutionId.toString() !== user.institutionId.toString()) {
        const error = new Error('Access denied. Course belongs to a different institution.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_INSTITUTION';
        throw error;
      }
    } else if (user.role === ROLES.INSTRUCTOR) {
      const isAssigned = course.instructorIds.some((instId) => instId.toString() === user._id.toString());
      if (!isAssigned) {
        const error = new Error('You are not assigned to edit this course.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_COURSE_EDIT';
        throw error;
      }
    }

    if (updateData.name) course.name = updateData.name.trim();
    if (updateData.department) course.department = updateData.department.trim();
    if (updateData.description !== undefined) course.description = updateData.description.trim();
    if (updateData.status && ['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(updateData.status)) {
      course.status = updateData.status;
    }

    await course.save();
    return course;
  }

  /**
   * Assign or remove instructors from course
   */
  async manageInstructors(courseId, instructorIds = [], action = 'add', user = null) {
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    if (user && user.role === ROLES.INSTITUTION_ADMIN) {
      if (user.institutionId && course.institutionId.toString() !== user.institutionId.toString()) {
        const error = new Error('Access denied. Course belongs to a different institution.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_INSTITUTION';
        throw error;
      }
    }

    if (instructorIds.length > 0 && (action === 'add' || action === 'set')) {
      const targetInstructors = await User.find({ _id: { $in: instructorIds } });
      if (targetInstructors.length !== instructorIds.length) {
        const error = new Error('One or more specified instructor user IDs do not exist.');
        error.statusCode = 400;
        error.code = 'INVALID_INSTRUCTOR_ID';
        throw error;
      }

      for (const inst of targetInstructors) {
        if (inst.institutionId && inst.institutionId.toString() !== course.institutionId.toString()) {
          const error = new Error(`Instructor ${inst.name || inst.email} belongs to a different institution and cannot be assigned to this course.`);
          error.statusCode = 400;
          error.code = 'CROSS_INSTITUTION_INSTRUCTOR';
          throw error;
        }
      }
    }

    if (action === 'add') {
      instructorIds.forEach((instId) => {
        if (!course.instructorIds.some((id) => id.toString() === instId.toString())) {
          course.instructorIds.push(instId);
        }
      });
    } else if (action === 'remove') {
      course.instructorIds = course.instructorIds.filter(
        (id) => !instructorIds.some((instId) => instId.toString() === id.toString())
      );
    } else if (action === 'set') {
      // Deduplicate
      const uniqueIds = [...new Set(instructorIds.map((id) => id.toString()))];
      course.instructorIds = uniqueIds;
    }

    await course.save();
    return course.populate('instructorIds', 'name email role avatar');
  }

  /**
   * Enroll or unenroll students from course
   */
  async manageStudents(courseId, studentIds, action = 'add') {
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    if (action === 'add') {
      studentIds.forEach((studId) => {
        if (!course.studentIds.includes(studId)) {
          course.studentIds.push(studId);
        }
      });
    } else if (action === 'remove') {
      course.studentIds = course.studentIds.filter(
        (id) => !studentIds.includes(id.toString())
      );
    } else if (action === 'set') {
      course.studentIds = studentIds;
    }

    await course.save();
    return course.populate('studentIds', 'name email role avatar');
  }

  /**
   * Student self-enrollment into an active course
   */
  async selfEnrollStudent(courseId, studentUser) {
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    if (course.status !== 'ACTIVE') {
      const error = new Error('Cannot enroll in an inactive or archived course.');
      error.statusCode = 400;
      error.code = 'COURSE_NOT_ACTIVE';
      throw error;
    }

    // Check institution match if student is bound to an institution
    if (studentUser.institutionId && course.institutionId.toString() !== studentUser.institutionId.toString()) {
      const error = new Error('Cannot enroll in a course outside your institution.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_INSTITUTION';
      throw error;
    }

    // Add student if not already enrolled
    if (!course.studentIds.includes(studentUser._id)) {
      course.studentIds.push(studentUser._id);
      await course.save();
    }

    return course;
  }

  /**
   * Archive course
   */
  async archiveCourse(courseId) {
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    course.status = 'ARCHIVED';
    await course.save();
    return course;
  }
}

module.exports = new CourseService();
