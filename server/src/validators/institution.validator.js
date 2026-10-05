const validateInstitutionInput = (data) => {
  const errors = [];
  const { name, code } = data || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Institution name is required.');
  }

  if (!code || typeof code !== 'string' || !code.trim()) {
    errors.push('Institution code is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateInstitutionInput,
};
