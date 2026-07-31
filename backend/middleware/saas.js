const licenseService = require('../services/licenseService');
const featureFlagService = require('../services/featureFlagService');

const support = {
  phone: process.env.SUPPORT_PHONE || '+91-XXXXXXXXXX',
  email: process.env.SUPPORT_EMAIL || 'support@edupilot.com'
};

const resolveTenant = (req) => {
  const tenantId = req.user?.tenantId || req.tenantId;
  const schoolId = req.user?.schoolId || req.school?._id;
  return { tenantId, schoolId };
};

// 1. License must be active (not blocked, not suspended, not expired)
const requireActiveLicense = async (req, res, next) => {
  try {
    if (req.user?.role === 'super_admin') return next();

    const { tenantId } = resolveTenant(req);
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }

    const result = await licenseService.validateLicense(tenantId);

    if (result.readOnly) {
      req.licenseReadOnly = true;
      return next();
    }

    if (!result.valid) {
      return res.status(403).json({
        success: false,
        error: 'Your subscription is inactive or has expired. Please contact support.',
        support
      });
    }

    req.license = result.license;
    next();
  } catch (error) {
    console.error('requireActiveLicense error:', error);
    res.status(500).json({ success: false, error: 'License validation failed' });
  }
};

// 2. Specific feature must be enabled for the tenant
const requireFeature = (featureCode) => {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'super_admin') return next();

      const { tenantId, schoolId } = resolveTenant(req);
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant ID is required' });
      }

      const enabled = await featureFlagService.isFeatureEnabled(tenantId, schoolId, featureCode);
      if (!enabled) {
        return res.status(403).json({
          success: false,
          error: `The ${featureCode} module is not enabled for your school. Please contact support to enable it.`
        });
      }

      next();
    } catch (error) {
      console.error('requireFeature error:', error);
      res.status(500).json({ success: false, error: 'Feature validation failed' });
    }
  };
};

// 3. Check student limit before creation/import
const checkStudentLimit = (requestedCount = 1) => {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'super_admin') return next();

      const { tenantId, schoolId } = resolveTenant(req);
      if (!tenantId || !schoolId) {
        return res.status(400).json({ success: false, error: 'Tenant and school context required' });
      }

      const count = typeof requestedCount === 'function'
        ? requestedCount(req)
        : requestedCount;

      const result = await licenseService.checkStudentLimit(tenantId, schoolId, count);

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: result.reason,
          current: result.current,
          limit: result.limit,
          remaining: result.remaining
        });
      }

      req.licenseCheck = result;
      next();
    } catch (error) {
      console.error('checkStudentLimit error:', error);
      res.status(500).json({ success: false, error: 'Student limit check failed' });
    }
  };
};

// 4. Check teacher limit
const checkTeacherLimit = (requestedCount = 1) => {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'super_admin') return next();

      const { tenantId, schoolId } = resolveTenant(req);
      if (!tenantId || !schoolId) return res.status(400).json({ success: false, error: 'Tenant and school context required' });

      const count = typeof requestedCount === 'function' ? requestedCount(req) : requestedCount;
      const result = await licenseService.checkTeacherLimit(tenantId, schoolId, count);

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: result.reason,
          current: result.current,
          limit: result.limit,
          remaining: result.remaining
        });
      }

      next();
    } catch (error) {
      console.error('checkTeacherLimit error:', error);
      res.status(500).json({ success: false, error: 'Teacher limit check failed' });
    }
  };
};

// 5. Check staff/employee limit
const checkStaffLimit = (requestedCount = 1) => {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'super_admin') return next();

      const { tenantId, schoolId } = resolveTenant(req);
      if (!tenantId || !schoolId) return res.status(400).json({ success: false, error: 'Tenant and school context required' });

      const count = typeof requestedCount === 'function' ? requestedCount(req) : requestedCount;
      const result = await licenseService.checkStaffLimit(tenantId, schoolId, count);

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: result.reason,
          current: result.current,
          limit: result.limit,
          remaining: result.remaining
        });
      }

      next();
    } catch (error) {
      console.error('checkStaffLimit error:', error);
      res.status(500).json({ success: false, error: 'Staff limit check failed' });
    }
  };
};

// 6. Check storage limit (expects additionalMB on req or function)
const checkStorageLimit = (additionalMB = 0) => {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'super_admin') return next();

      const { tenantId } = resolveTenant(req);
      if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context required' });

      const extra = typeof additionalMB === 'function' ? additionalMB(req) : additionalMB;
      const result = await licenseService.checkStorageLimit(tenantId, extra);

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: result.reason,
          current: result.current,
          limit: result.limit,
          remaining: result.remaining
        });
      }

      next();
    } catch (error) {
      console.error('checkStorageLimit error:', error);
      res.status(500).json({ success: false, error: 'Storage limit check failed' });
    }
  };
};

// 7. Check AI credits
const checkAICredits = (requestedCredits = 1) => {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'super_admin') return next();

      const { tenantId } = resolveTenant(req);
      if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context required' });

      const credits = typeof requestedCredits === 'function' ? requestedCredits(req) : requestedCredits;
      const result = await licenseService.checkAICredits(tenantId, credits);

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: result.reason,
          current: result.current,
          limit: result.limit,
          remaining: result.remaining
        });
      }

      next();
    } catch (error) {
      console.error('checkAICredits error:', error);
      res.status(500).json({ success: false, error: 'AI credit check failed' });
    }
  };
};

// 8. Read-only mode: allow GET, block mutating methods when license is expired/read-only
const requireWriteAccess = async (req, res, next) => {
  try {
    if (req.user?.role === 'super_admin') return next();

    const { tenantId } = resolveTenant(req);
    if (!tenantId) return res.status(400).json({ success: false, error: 'Tenant context required' });

    const license = await licenseService.getLicense(tenantId);

    if (licenseService.isReadOnly(license)) {
      return res.status(403).json({
        success: false,
        error: 'Your subscription has expired. The application is in read-only mode.',
        message: `Please contact Support. ${support.phone} | ${support.email}`,
        support,
        readOnly: true
      });
    }

    next();
  } catch (error) {
    console.error('requireWriteAccess error:', error);
    res.status(500).json({ success: false, error: 'Write access check failed' });
  }
};

// 9. Combined mutating route guard (license + feature + write access)
const requireMutatingAccess = (featureCode) => {
  return async (req, res, next) => {
    try {
      if (req.user?.role === 'super_admin') return next();

      const { tenantId, schoolId } = resolveTenant(req);
      if (!tenantId || !schoolId) return res.status(400).json({ success: false, error: 'Tenant and school context required' });

      const licenseResult = await licenseService.validateLicense(tenantId);
      if (licenseResult.readOnly) {
        return res.status(403).json({
          success: false,
          error: 'Your subscription has expired. Application is in read-only mode.',
          support
        });
      }
      if (!licenseResult.valid) {
        return res.status(403).json({
          success: false,
          error: 'Your subscription is inactive or expired.',
          support
        });
      }

      if (featureCode) {
        const enabled = await featureFlagService.isFeatureEnabled(tenantId, schoolId, featureCode);
        if (!enabled) {
          return res.status(403).json({
            success: false,
            error: `The ${featureCode} module is not enabled for your school.`
          });
        }
      }

      req.license = licenseResult.license;
      next();
    } catch (error) {
      console.error('requireMutatingAccess error:', error);
      res.status(500).json({ success: false, error: 'Access validation failed' });
    }
  };
};

module.exports = {
  requireActiveLicense,
  requireFeature,
  checkStudentLimit,
  checkTeacherLimit,
  checkStaffLimit,
  checkStorageLimit,
  checkAICredits,
  requireWriteAccess,
  requireMutatingAccess
};
