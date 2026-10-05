const institutionService = require('../services/institution.service');
const { validateInstitutionInput } = require('../validators/institution.validator');

/**
 * POST /api/v1/institutions
 * Create institution (SUPER_ADMIN)
 */
const create = async (req, res, next) => {
  try {
    const { isValid, errors } = validateInstitutionInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
        code: 'VALIDATION_ERROR',
        errors,
      });
    }

    const { name, code, departments, settings } = req.body;
    const institution = await institutionService.createInstitution({ name, code, departments, settings });

    return res.status(201).json({
      success: true,
      message: 'Institution created successfully.',
      data: { institution },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/institutions
 * List institutions
 */
const getAll = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role !== 'SUPER_ADMIN' && req.user.institutionId) {
      filter._id = req.user.institutionId;
    }

    const institutions = await institutionService.getAllInstitutions(filter);

    return res.status(200).json({
      success: true,
      data: { institutions },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/institutions/:id
 * Get institution details
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // RBAC check for Institution Admin
    if (req.user.role === 'INSTITUTION_ADMIN' && req.user.institutionId && req.user.institutionId.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to other institution data.',
        code: 'FORBIDDEN_INSTITUTION',
      });
    }

    const institution = await institutionService.getInstitutionById(id);

    return res.status(200).json({
      success: true,
      data: { institution },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/institutions/:id
 * Update institution
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'INSTITUTION_ADMIN' && req.user.institutionId && req.user.institutionId.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to modify other institution data.',
        code: 'FORBIDDEN_INSTITUTION',
      });
    }

    const institution = await institutionService.updateInstitution(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Institution updated successfully.',
      data: { institution },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/institutions/:id/departments
 * Add department
 */
const addDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { department } = req.body;

    if (!department || typeof department !== 'string' || !department.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required.',
        code: 'VALIDATION_ERROR',
      });
    }

    const institution = await institutionService.addDepartment(id, department);

    return res.status(200).json({
      success: true,
      message: 'Department added successfully.',
      data: { institution },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/institutions/:id/archive
 * Archive institution (SUPER_ADMIN)
 */
const archive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const institution = await institutionService.archiveInstitution(id);

    return res.status(200).json({
      success: true,
      message: 'Institution archived successfully.',
      data: { institution },
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
  addDepartment,
  archive,
};
