const CourseMaterial = require('../models/CourseMaterial');
const Course = require('../models/Course');
const storageService = require('../storage/storage.service');
const { validateMaterialFile } = require('../validators/material.validator');
const { ROLES } = require('../constants/roles');

class MaterialService {
  /**
   * Helper to verify user permissions for a course
   */
  async checkCourseAccess(courseId, user, requiredPermission = 'view') {
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    if (user.role === ROLES.SUPER_ADMIN) {
      if (requiredPermission === 'manage') {
        const error = new Error('Admins are not authorized to upload or manage instructor course materials.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_ADMIN_ACTION';
        throw error;
      }
      return course;
    }

    if (user.role === ROLES.INSTITUTION_ADMIN) {
      if (!user.institutionId || course.institutionId.toString() !== user.institutionId.toString()) {
        const error = new Error('Access denied. Course belongs to a different institution.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_INSTITUTION';
        throw error;
      }
      if (requiredPermission === 'manage') {
        const error = new Error('Admins are not authorized to upload or manage instructor course materials.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_ADMIN_ACTION';
        throw error;
      }
      return course;
    }

    if (user.role === ROLES.INSTRUCTOR) {
      const isAssigned = course.instructorIds.some((id) => id.toString() === user._id.toString());
      if (!isAssigned) {
        const error = new Error('You are not assigned to this course.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_COURSE_ACCESS';
        throw error;
      }
      return course;
    }

    if (user.role === ROLES.STUDENT) {
      if (requiredPermission === 'manage') {
        const error = new Error('Students are not authorized to perform management actions on course materials.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_STUDENT_ACTION';
        throw error;
      }

      const isEnrolled = course.studentIds.some((id) => id.toString() === user._id.toString());
      if (!isEnrolled) {
        const error = new Error('Access denied. You are not enrolled in this course.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_COURSE_ACCESS';
        throw error;
      }
      return course;
    }

    const error = new Error('Unauthorized role access.');
    error.statusCode = 403;
    throw error;
  }

  /**
   * Upload and create new course material
   */
  async createMaterial({ courseId, user, file, title, description, topic }) {
    const course = await this.checkCourseAccess(courseId, user, 'manage');

    const validation = validateMaterialFile(file);
    if (!validation.isValid) {
      const error = new Error(validation.errors.join(' '));
      error.statusCode = 400;
      error.code = 'INVALID_MATERIAL_FILE';
      error.errors = validation.errors;
      throw error;
    }

    const savedFile = await storageService.saveFile(file);

    const materialTitle = title ? title.trim() : file.originalname;

    const material = await CourseMaterial.create({
      courseId: course._id,
      institutionId: course.institutionId,
      title: materialTitle,
      description: description ? description.trim() : '',
      fileName: savedFile.fileName,
      originalFileName: file.originalname,
      fileType: validation.fileType,
      mimeType: savedFile.mimeType,
      fileSize: savedFile.fileSize,
      fileKey: savedFile.fileKey,
      uploadedBy: user._id,
      status: 'READY',
      visibility: 'DRAFT',
      metadata: {
        topic: topic ? topic.trim() : '',
      },
    });

    return material.populate('uploadedBy', 'name email role');
  }

  /**
   * Get list of course materials
   */
  async getMaterialsForCourse(courseId, user) {
    const course = await this.checkCourseAccess(courseId, user, 'view');

    let query = { courseId: course._id, status: { $ne: 'ARCHIVED' } };

    if (user.role === ROLES.STUDENT) {
      query.visibility = 'PUBLISHED';
      query.status = 'READY';
    }

    const materials = await CourseMaterial.find(query)
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 });

    return materials;
  }

  /**
   * Get single material details
   */
  async getMaterialById(materialId, user) {
    const material = await CourseMaterial.findById(materialId).populate('uploadedBy', 'name email role');
    if (!material) {
      const error = new Error('Course material not found.');
      error.statusCode = 404;
      error.code = 'MATERIAL_NOT_FOUND';
      throw error;
    }

    await this.checkCourseAccess(material.courseId, user, 'view');

    if (user.role === ROLES.STUDENT) {
      if (material.visibility !== 'PUBLISHED' || material.status !== 'READY') {
        const error = new Error('Access denied. Material is not published.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_UNPUBLISHED_MATERIAL';
        throw error;
      }
    }

    return material;
  }

  /**
   * Update material metadata
   */
  async updateMaterial(materialId, user, updateData) {
    const material = await CourseMaterial.findById(materialId);
    if (!material) {
      const error = new Error('Course material not found.');
      error.statusCode = 404;
      error.code = 'MATERIAL_NOT_FOUND';
      throw error;
    }

    await this.checkCourseAccess(material.courseId, user, 'manage');

    if (updateData.title) material.title = updateData.title.trim();
    if (updateData.description !== undefined) material.description = updateData.description.trim();
    if (updateData.topic !== undefined) {
      material.metadata = { ...material.metadata, topic: updateData.topic.trim() };
    }

    await material.save();
    return material.populate('uploadedBy', 'name email role');
  }

  /**
   * Toggle publish state
   */
  async publishMaterial(materialId, user, publishState = true) {
    const material = await CourseMaterial.findById(materialId);
    if (!material) {
      const error = new Error('Course material not found.');
      error.statusCode = 404;
      error.code = 'MATERIAL_NOT_FOUND';
      throw error;
    }

    await this.checkCourseAccess(material.courseId, user, 'manage');

    material.visibility = publishState ? 'PUBLISHED' : 'DRAFT';
    await material.save();
    return material.populate('uploadedBy', 'name email role');
  }

  /**
   * Archive material
   */
  async archiveMaterial(materialId, user) {
    const material = await CourseMaterial.findById(materialId);
    if (!material) {
      const error = new Error('Course material not found.');
      error.statusCode = 404;
      error.code = 'MATERIAL_NOT_FOUND';
      throw error;
    }

    await this.checkCourseAccess(material.courseId, user, 'manage');

    material.status = 'ARCHIVED';
    material.visibility = 'DRAFT';
    await material.save();
    return material.populate('uploadedBy', 'name email role');
  }

  /**
   * Delete material and associated file
   */
  async deleteMaterial(materialId, user) {
    const material = await CourseMaterial.findById(materialId);
    if (!material) {
      const error = new Error('Course material not found.');
      error.statusCode = 404;
      error.code = 'MATERIAL_NOT_FOUND';
      throw error;
    }

    await this.checkCourseAccess(material.courseId, user, 'manage');

    await storageService.deleteFile(material.fileKey);
    await CourseMaterial.findByIdAndDelete(materialId);

    return { success: true, id: materialId };
  }

  /**
   * Get safe file path for download stream
   */
  async getDownloadFilePath(materialId, user) {
    const material = await CourseMaterial.findById(materialId);
    if (!material) {
      const error = new Error('Course material not found.');
      error.statusCode = 404;
      error.code = 'MATERIAL_NOT_FOUND';
      throw error;
    }

    await this.checkCourseAccess(material.courseId, user, 'view');

    if (user.role === ROLES.STUDENT) {
      if (material.visibility !== 'PUBLISHED' || material.status !== 'READY') {
        const error = new Error('Access denied. Material is not published.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_UNPUBLISHED_MATERIAL';
        throw error;
      }
    }

    const filePath = storageService.getFilePath(material.fileKey);
    return {
      filePath,
      originalFileName: material.originalFileName,
      mimeType: material.mimeType,
    };
  }
}

module.exports = new MaterialService();
