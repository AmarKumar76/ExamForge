const authService = require('../services/auth.service');
const {
  validateRegisterInput,
  validateLoginInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
} = require('../validators/auth.validator');

/**
 * Controller handling user registration
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  return res.status(403).json({
    success: false,
    message: 'Public account registration is disabled. Accounts are created and provisioned by institution administrators.',
    code: 'PUBLIC_REGISTRATION_DISABLED',
  });
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

/**
 * Controller handling password reset request (Forgot Password)
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { isValid, errors } = validateForgotPasswordInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
        code: 'VALIDATION_ERROR',
        errors,
      });
    }

    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling password reset submission
 * POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { isValid, errors } = validateResetPasswordInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
        code: 'VALIDATION_ERROR',
        errors,
      });
    }

    const { token, password } = req.body;
    const result = await authService.resetPassword({ token, password });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling email verification
 * POST /api/v1/auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await authService.verifyEmail(token);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling resending verification email
 * POST /api/v1/auth/resend-verification
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendVerification(email);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
