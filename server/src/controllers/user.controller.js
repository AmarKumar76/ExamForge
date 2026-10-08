const userService = require('../services/user.service');
const auditService = require('../services/audit.service');

class UserController {
  async getUsers(req, res, next) {
    try {
      const users = await userService.getUsers(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  async createUser(req, res, next) {
    try {
      const result = await userService.createUser(req.body, req.user);

      const targetUser = result.user || {};
      auditService.logAudit({
        actor: req.user,
        action: 'ACCOUNT_CREATED',
        resourceType: 'User',
        resourceId: targetUser.id || targetUser._id,
        resourceName: targetUser.name,
        institutionId: targetUser.institutionId,
        status: 'SUCCESS',
        metadata: { role: targetUser.role, email: targetUser.email, welcomeEmailSent: result.welcomeEmailSent },
        req,
      });

      return res.status(201).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          welcomeEmailSent: result.welcomeEmailSent,
          emailError: result.emailError,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async resendWelcomeEmail(req, res, next) {
    try {
      const result = await userService.resendWelcomeEmail(req.params.id, req.user);
      return res.status(200).json({
        success: result.success,
        message: result.message,
        data: {
          welcomeEmailSent: result.success,
          emailError: result.emailError,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async bulkImportUsers(req, res, next) {
    try {
      const summary = await userService.bulkImportUsers(req.body, req.user);

      auditService.logAudit({
        actor: req.user,
        action: 'USER_BULK_IMPORT',
        resourceType: 'User',
        status: 'SUCCESS',
        metadata: {
          totalRows: summary.totalRows,
          successCount: summary.successCount,
          failedCount: summary.failedCount,
        },
        req,
      });

      return res.status(200).json({
        success: true,
        message: `Bulk import completed: ${summary.successCount} users created/updated, ${summary.failedCount} failed.`,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { status } = req.body;
      const user = await userService.updateUserStatus(req.params.id, status, req.user);

      auditService.logAudit({
        actor: req.user,
        action: 'ACCOUNT_STATUS_CHANGED',
        resourceType: 'User',
        resourceId: user.id || user._id,
        resourceName: user.name,
        institutionId: user.institutionId,
        status: 'SUCCESS',
        metadata: { newStatus: status },
        req,
      });

      return res.status(200).json({
        success: true,
        message: `User status updated to ${status}.`,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user._id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const result = await userService.changePassword(req.user._id, req.body);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const user = await userService.updatePreferences(req.user._id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully.',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
