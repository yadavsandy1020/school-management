const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Parent login: token has role=parent and studentId
      if (decoded.role === 'parent' && decoded.studentId) {
        const student = await Student.findById(decoded.studentId).select('-parentId');
        if (!student || !student.isActive) {
          return res.status(401).json({
            success: false,
            error: 'Student account not found or inactive'
          });
        }
        req.user = {
          _id: student._id,
          id: student._id,
          role: 'parent',
          studentId: student._id,
          tenantId: student.tenantId,
          schoolId: student.schoolId,
          name: `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim()
        };
        return next();
      }

      // Get user from token with role permissions
      req.user = await User.findById(decoded.id)
        .select('-password')
        .populate('roleId', 'name slug permissions permissionCodes');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      if (req.user.isDeleted || req.user.isActive === false) {
        return res.status(401).json({
          success: false,
          error: 'Account is disabled'
        });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check required permission code(s) against user's role. Any one is sufficient (OR).
const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Super admin bypass
    if (req.user.role === 'super_admin') {
      return next();
    }

    const role = req.user.roleId;

    if (!role) {
      return res.status(403).json({ success: false, error: 'Role not assigned' });
    }

    const hasPermission = permissions.some(code => {
      if (typeof role.hasPermission === 'function') {
        return role.hasPermission(code);
      }
      const codes = role.permissionCodes || [];
      return codes.includes(code) || codes.includes('*');
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Check one or more allowed roles (OR).
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (roles.includes(req.user.role) || req.user.role === 'super_admin') {
      return next();
    }

    return res.status(403).json({ success: false, error: 'Role not authorized' });
  };
};

module.exports = { protect, authorize, requirePermission, requireRole };
