/**
 * Reusable Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles - Permitted roles (e.g. 'STUDENT', 'INSTRUCTOR')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to permission check.',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following roles: [${allowedRoles.join(', ')}]`,
        code: 'FORBIDDEN_ROLE',
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
};
