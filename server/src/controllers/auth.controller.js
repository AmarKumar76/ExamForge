const authService = require('../services/auth.service');
const { validateRegisterInput, validateLoginInput } = require('../validators/auth.validator');

/**
 * Controller handling user registration
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { isValid, errors } = validateRegisterInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
        code: 'VALIDATION_ERROR',
        errors,
      });
    }

    const { name, email, password, role } = req.body;
    const result = await authService.registerUser({ name, email, password, role });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling user authentication
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { isValid, errors } = validateLoginInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
        code: 'VALIDATION_ERROR',
        errors,
      });
    }

    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller returning authenticated user profile
 * GET /api/v1/auth/me
 */
const me = async (req, res, next) => {
  try {
    const userProfile = await authService.getCurrentUser(req.user._id);

    return res.status(200).json({
      success: true,
      data: {
        user: userProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  me,
};
