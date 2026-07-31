const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry asynchronously without blocking the request.
 */
const createAuditLog = async ({
  tenantId,
  schoolId,
  user,
  action,
  module,
  description,
  entity,
  entityId,
  oldValue = null,
  newValue = null,
  ip,
  userAgent,
  metadata = {}
}) => {
  try {
    const log = new AuditLog({
      tenantId,
      schoolId,
      userId: user ? user._id : null,
      userEmail: user ? user.email : null,
      userRole: user ? user.role : null,
      action,
      module,
      description,
      entity,
      entityId,
      oldValue,
      newValue,
      ip,
      userAgent,
      metadata
    });
    await log.save();
  } catch (err) {
    // Audit logging must never break core application logic
    console.error('Audit log creation failed:', err.message);
  }
};

/**
 * Express middleware to attach audit helper to request.
 * Captures IP and user agent automatically.
 */
const auditMiddleware = (req, res, next) => {
  req.audit = (data) =>
    createAuditLog({
      tenantId: req.tenantId,
      schoolId: req.schoolId,
      user: req.user,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      ...data
    });
  next();
};

module.exports = { createAuditLog, auditMiddleware };
