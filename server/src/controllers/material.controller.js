const materialService = require('../services/material.service');

/**
 * POST /api/v1/courses/:courseId/materials
 * Upload course material file
 */
const create = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, topic } = req.body;
    const file = req.file;

    const material = await materialService.createMaterial({
      courseId,
      user: req.user,
      file,
      title,
      description,
      topic,
    });

    return res.status(201).json({
      success: true,
      message: 'Course material uploaded successfully.',
      data: { material },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/courses/:courseId/materials
 * List materials for course
 */
const getByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const materials = await materialService.getMaterialsForCourse(courseId, req.user);

    return res.status(200).json({
      success: true,
      data: { materials },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/materials/:id
 * Get single material
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const material = await materialService.getMaterialById(id, req.user);

    return res.status(200).json({
      success: true,
      data: { material },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/materials/:id
 * Update material title/description/topic
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const material = await materialService.updateMaterial(id, req.user, req.body);

    return res.status(200).json({
      success: true,
      message: 'Course material updated successfully.',
      data: { material },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/materials/:id/publish
 * Publish or unpublish material
 */
const publish = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { publish } = req.body; // boolean, default true
    const material = await materialService.publishMaterial(
      id,
      req.user,
      publish !== undefined ? Boolean(publish) : true
    );

    return res.status(200).json({
      success: true,
      message: `Course material ${material.visibility === 'PUBLISHED' ? 'published' : 'unpublished'} successfully.`,
      data: { material },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/materials/:id/archive
 * Archive material
 */
const archive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const material = await materialService.archiveMaterial(id, req.user);

    return res.status(200).json({
      success: true,
      message: 'Course material archived successfully.',
      data: { material },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/materials/:id
 * Delete material
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await materialService.deleteMaterial(id, req.user);

    return res.status(200).json({
      success: true,
      message: 'Course material deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/materials/:id/download
 * Download material file
 */
const download = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { filePath, originalFileName, mimeType } = await materialService.getDownloadFilePath(id, req.user);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalFileName)}"`);
    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getByCourse,
  getById,
  update,
  publish,
  archive,
  remove,
  download,
};
