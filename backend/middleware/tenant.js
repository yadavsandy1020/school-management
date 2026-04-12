const School = require('../models/School');

// Middleware to extract and validate tenant from request
const tenantMiddleware = async (req, res, next) => {
  try {
    // Skip tenant check for super admin routes
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }

    // Get tenantId from header, query param, or authenticated user
    const tenantId = req.headers['x-tenant-id'] || 
                     req.query.tenantId || 
                     (req.user && req.user.tenantId);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required'
      });
    }

    // Validate tenant exists
    const school = await School.findOne({ tenantId, isActive: true });
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found or inactive'
      });
    }

    // Attach tenant to request
    req.tenantId = tenantId;
    req.school = school;
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Tenant validation failed'
    });
  }
};

// Middleware to inject tenant filter in queries
const tenantQuery = (req, res, next) => {
  if (req.tenantId) {
    req.query.tenantId = req.tenantId;
  }
  next();
};

module.exports = { tenantMiddleware, tenantQuery };
