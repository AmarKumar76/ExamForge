const Institution = require('../models/Institution');
const User = require('../models/User');

class InstitutionService {
  /**
   * Create a new institution
   */
  async createInstitution({ name, code, departments, settings }) {
    const uppercaseCode = code.toUpperCase().trim();

    const existing = await Institution.findOne({ code: uppercaseCode });
    if (existing) {
      const error = new Error('An institution with this code already exists.');
      error.statusCode = 409;
      error.code = 'DUPLICATE_INSTITUTION_CODE';
      throw error;
    }

    const institution = await Institution.create({
      name: name.trim(),
      code: uppercaseCode,
      departments: Array.isArray(departments) && departments.length > 0 ? departments : undefined,
      settings: settings || undefined,
    });

    return institution;
  }

  /**
   * Get all institutions
   */
  async getAllInstitutions(filter = {}) {
    const institutions = await Institution.find(filter).sort({ name: 1 });
    return institutions;
  }

  /**
   * Get institution by ID
   */
  async getInstitutionById(id) {
    const institution = await Institution.findById(id);
    if (!institution) {
      const error = new Error('Institution not found.');
      error.statusCode = 404;
      error.code = 'INSTITUTION_NOT_FOUND';
      throw error;
    }
    return institution;
  }

  /**
   * Update institution
   */
  async updateInstitution(id, updateData) {
    const institution = await this.getInstitutionById(id);

    if (updateData.name) institution.name = updateData.name.trim();
    if (updateData.departments && Array.isArray(updateData.departments)) {
      institution.departments = updateData.departments;
    }
    if (updateData.settings) {
      institution.settings = { ...institution.settings, ...updateData.settings };
    }
    if (updateData.status && ['ACTIVE', 'ARCHIVED'].includes(updateData.status)) {
      institution.status = updateData.status;
    }

    await institution.save();
    return institution;
  }

  /**
   * Add department to institution
   */
  async addDepartment(id, departmentName) {
    const institution = await this.getInstitutionById(id);
    const trimmed = departmentName.trim();
    if (!institution.departments.includes(trimmed)) {
      institution.departments.push(trimmed);
      await institution.save();
    }
    return institution;
  }

  /**
   * Archive institution
   */
  async archiveInstitution(id) {
    const institution = await this.getInstitutionById(id);
    institution.status = 'ARCHIVED';
    await institution.save();
    return institution;
  }
}

module.exports = new InstitutionService();
