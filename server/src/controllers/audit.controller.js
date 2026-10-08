const auditService = require('../services/audit.service');

class AuditController {
  async getAuditLogs(req, res, next) {
    try {
      const result = await auditService.getAuditLogs(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSystemLogs(req, res, next) {
    try {
      const result = await auditService.getSystemLogs(req.user, req.query);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getLogCounts(req, res, next) {
    try {
      const counts = await auditService.getLogCounts(req.user);
      return res.status(200).json({
        success: true,
        data: counts,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const analytics = await auditService.getAdminAnalytics(req.user);
      return res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuditController();
