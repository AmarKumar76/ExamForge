const courseService = require('../services/course.service');
const auditService = require('../services/audit.service');
const { validateCourseInput } = require('../validators/course.validator');

/**
 * POST /api/v1/courses
 * Create course
 */
const create = async (req, res, next) => {
  try {
    const { isValid, errors } = validateCourseInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
        code: 'VALIDATION_ERROR',
        errors,
      });
    }

    const { institutionId, department, name, code, description, instructorIds, studentIds } = req.body;
    
    // Default institutionId to user's assigned institution if not passed
    const targetInstitutionId = institutionId || req.user.institutionId;
    if (!targetInstitutionId) {
      return res.status(400).json({
        success: false,
        message: 'Institution ID is required.',
        code: 'INSTITUTION_ID_REQUIRED',
      });
    }

    const course = await courseService.createCourse({
      institutionId: targetInstitutionId,
      department,
      name,
      code,
      description,
      instructorIds,
      studentIds,
    });

    auditService.logAudit({
      user: req.user,
      action: 'COURSE_CREATED',
      resourceType: 'COURSE',
      resourceId: course._id.toString(),
      resourceName: `${course.code} - ${course.name}`,
      courseId: course._id,
      institutionId: course.institutionId,
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/courses
 * List courses with role-based scoping
 */
const getAll = async (req, res, next) => {
  try {
    const courses = await courseService.getCoursesForUser(req.user, req.query);

    return res.status(200).json({
      success: true,
      data: { courses },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/courses/:id
 * Get course by ID
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await courseService.getCourseById(id, req.user);

    return res.status(200).json({
      success: true,
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/courses/:id
 * Update course
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await courseService.updateCourse(id, req.body, req.user);

    auditService.logAudit({
      user: req.user,
      action: 'COURSE_UPDATED',
      resourceType: 'COURSE',
      resourceId: course._id.toString(),
      resourceName: `${course.code} - ${course.name}`,
      courseId: course._id,
      institutionId: course.institutionId,
    });

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/courses/:id/instructors
 * Assign or remove instructors
 */
const manageInstructors = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { instructorIds, action } = req.body; // action: 'add' | 'remove' | 'set'

    if (!Array.isArray(instructorIds)) {
      return res.status(400).json({
        success: false,
        message: 'instructorIds must be an array of user IDs.',
        code: 'VALIDATION_ERROR',
      });
    }

    const course = await courseService.manageInstructors(id, instructorIds, action || 'add', req.user);

    auditService.logAudit({
      user: req.user,
      action: action === 'remove' ? 'INSTRUCTOR_REMOVED' : 'INSTRUCTOR_ASSIGNED',
      resourceType: 'COURSE',
      resourceId: course._id.toString(),
      resourceName: `${course.code} - ${course.name}`,
      courseId: course._id,
      institutionId: course.institutionId,
      metadata: { instructorIds, action },
    });

    return res.status(200).json({
      success: true,
      message: 'Instructor assignments updated successfully.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/courses/:id/students
 * Enroll or unenroll students
 */
const manageStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentIds, action } = req.body; // action: 'add' | 'remove' | 'set'

    if (!Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'studentIds must be an array of user IDs.',
        code: 'VALIDATION_ERROR',
      });
    }

    const course = await courseService.manageStudents(id, studentIds, action || 'add');

    auditService.logAudit({
      user: req.user,
      action: action === 'remove' ? 'STUDENT_REMOVED' : 'STUDENT_ENROLLED',
      resourceType: 'COURSE',
      resourceId: course._id.toString(),
      resourceName: `${course.code} - ${course.name}`,
      courseId: course._id,
      institutionId: course.institutionId,
      metadata: { studentIds, action },
    });

    return res.status(200).json({
      success: true,
      message: 'Student enrollment updated successfully.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/courses/:id/enroll
 * Student self-enrollment
 */
const selfEnroll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await courseService.selfEnrollStudent(id, req.user);

    auditService.logAudit({
      user: req.user,
      action: 'STUDENT_ENROLLED',
      resourceType: 'COURSE',
      resourceId: course._id.toString(),
      resourceName: `${course.code} - ${course.name}`,
      courseId: course._id,
      institutionId: course.institutionId,
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully enrolled in course.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/courses/:id/archive
 * Archive course
 */
const archive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await courseService.archiveCourse(id);

    auditService.logAudit({
      user: req.user,
      action: 'COURSE_ARCHIVED',
      resourceType: 'COURSE',
      resourceId: course._id.toString(),
      resourceName: `${course.code} - ${course.name}`,
      courseId: course._id,
      institutionId: course.institutionId,
    });

    return res.status(200).json({
      success: true,
      message: 'Course archived successfully.',
      data: { course },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  manageInstructors,
  manageStudents,
  selfEnroll,
  archive,
};
