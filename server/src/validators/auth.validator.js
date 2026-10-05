const { ROLES } = require('../constants/roles');

/**
 * Validates registration request payload
 * @param {object} body 
 * @returns {object} { isValid, errors }
 */
const validateRegisterInput = (body = {}) => {
  const errors = [];
  const { name, email, password, role } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Full name is required.');
  } else if (name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters.');
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }

  // Self-registration rule: Public register is restricted to STUDENT or INSTRUCTOR
  if (role) {
    const validPublicRoles = [ROLES.STUDENT, ROLES.INSTRUCTOR];
    if (!validPublicRoles.includes(role)) {
      errors.push('Public registration is restricted to STUDENT or INSTRUCTOR roles.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates login request payload
 * @param {object} body 
 * @returns {object} { isValid, errors }
 */
const validateLoginInput = (body = {}) => {
  const errors = [];
  const { email, password } = body;

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email is required.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
};
