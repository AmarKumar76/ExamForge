const config = require('../config/env');
const auditService = require('../services/audit.service');

/**
 * 404 Route Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
};

/**
 * Centralized Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode || 500;
  if (statusCode === 200) statusCode = 500;

  let message = err.message || 'An unexpected internal server error occurred.';
  let code = err.code || 'INTERNAL_SERVER_ERROR';

  // Handle Mongoose duplicate key error (e.g. duplicate email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with this ${field} already exists.`;
    code = 'DUPLICATE_RESOURCE';
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const validationErrors = Object.values(err.errors).map((e) => e.message);
    message = validationErrors.join(', ');
    code = 'VALIDATION_ERROR';
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource identifier format: ${err.path}`;
    code = 'INVALID_ID';
  }

  // Log Security & System Events safely without blocking error response
  try {
    if (statusCode === 401) {
      auditService.logAudit({
        actor: req.user || null,
        action: 'UNAUTHORIZED_ACCESS',
        resourceType: 'API',
        resourceName: req.originalUrl,
        status: 'FAILED',
        metadata: { path: req.originalUrl, method: req.method, code, message },
        req,
      });
    } else if (statusCode === 403) {
      auditService.logAudit({
        actor: req.user || null,
        action: 'FORBIDDEN_RESOURCE_ACCESS',
        resourceType: 'API',
        resourceName: req.originalUrl,
        status: 'FAILED',
        metadata: { path: req.originalUrl, method: req.method, code, message },
        req,
      });
    } else if (statusCode === 400 || code === 'INVALID_ID') {
      auditService.logAudit({
        actor: req.user || null,
        action: 'INVALID_RESOURCE_REQUEST',
        resourceType: 'API',
        resourceName: req.originalUrl,
        status: 'FAILED',
        metadata: { path: req.originalUrl, method: req.method, code, message },
        req,
      });
    }

    if (statusCode >= 500) {
      auditService.logSystem({
        level: 'ERROR',
        service: 'API',
        module: 'ExpressRoute',
        event: 'SERVER_ERROR',
        message: err.message || 'Internal server error',
        status: 'ERROR',
        requestId: req.headers['x-request-id'] || null,
        stackTrace: err.stack,
        institutionId: req.user?.institutionId || null,
        metadata: { path: req.originalUrl, method: req.method, code },
      });
    }
  } catch (logErr) {
    console.error('Failed to write audit/system log in errorHandler:', logErr);
  }

  const response = {
    success: false,
    message,
    code,
  };

  if (config.env === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};

