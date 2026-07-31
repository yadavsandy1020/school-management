const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const School = require('../models/School');
const Role = require('../models/Role');
const { createAuditLog } = require('../utils/audit');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    expiresIn: '30d'
  });
};

// Resolve default system role id for a given role slug
const getDefaultRoleId = async (roleSlug) => {
  const role = await Role.findOne({ slug: roleSlug, tenantId: { $exists: false }, isActive: true });
  return role ? role._id : null;
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, tenantId, schoolId } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // For school admin and below, validate tenant and school
    if (role !== 'super_admin') {
      if (!tenantId || !schoolId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID and School ID are required for this role'
        });
      }

      const school = await School.findOne({ tenantId, _id: schoolId });
      if (!school) {
        return res.status(404).json({
          success: false,
          error: 'School not found'
        });
      }
    }

    // Resolve default role for non-super-admin users
    const roleId = role === 'super_admin' ? null : await getDefaultRoleId(role);

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      roleId,
      tenantId,
      schoolId
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleId: user.roleId,
        tenantId: user.tenantId,
        schoolId: user.schoolId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Your account has been deactivated'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // For non-super-admin, validate tenant
    if (user.role !== 'super_admin') {
      if (!tenantId) {
        // Derive tenant from the user's school/tenant record when UI does not send it
        if (!user.tenantId) {
          return res.status(400).json({
            success: false,
            error: 'Tenant not assigned to user'
          });
        }
      } else if (user.tenantId !== tenantId) {
        return res.status(403).json({
          success: false,
          error: 'You are not authorized for this tenant'
        });
      }
    }

    // Update last login
    user.lastLogin = Date.now();

    // Resolve default role if not set
    if (!user.roleId && user.role !== 'super_admin') {
      user.roleId = await getDefaultRoleId(user.role);
      if (user.roleId) await user.save({ validateBeforeSave: false });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    // Populate role permissions
    await user.populate('roleId', 'name slug permissionCodes');
    const permissions = user.roleId?.permissionCodes || [];

    // Audit login
    createAuditLog({
      tenantId: user.tenantId,
      schoolId: user.schoolId,
      user,
      action: 'LOGIN',
      module: 'auth',
      description: `User ${user.email} logged in`,
      entity: 'User',
      entityId: user._id.toString(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => { });

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleId: user.roleId,
        permissions,
        tenantId: user.tenantId,
        schoolId: user.schoolId,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Parent login (Roll No + DOB)
// @route   POST /api/auth/parent-login
// @access  Public
exports.parentLogin = async (req, res) => {
  try {
    const { rollNo, dateOfBirth, classId } = req.body;

    if (!rollNo || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'Roll number and date of birth are required'
      });
    }

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date of birth format'
      });
    }

    // Build query to find the student by rollNo + DOB
    const query = {
      rollNo,
      'personalInfo.dateOfBirth': dob,
      isActive: true
    };
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      query.classId = classId;
    }

    const student = await Student.findOne(query)
      .populate('classId', 'name sections')
      .populate('schoolId', 'name shortName address contact');

    if (!student) {
      return res.status(401).json({
        success: false,
        error: 'No student found with the provided roll number and date of birth'
      });
    }

    // Generate a JWT with role parent and studentId embedded
    const token = jwt.sign(
      { id: student._id, role: 'parent', studentId: student._id, tenantId: student.tenantId, schoolId: student.schoolId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: student._id,
        role: 'parent',
        studentId: student._id,
        name: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
        tenantId: student.tenantId,
        schoolId: student.schoolId,
        student: {
          admissionNo: student.admissionNo,
          rollNo: student.rollNo,
          classId: student.classId?._id,
          className: student.classId?.name,
          section: student.section
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('roleId', 'name slug permissionCodes');

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        permissions: user.roleId?.permissionCodes || []
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');

    // Find user with matching refresh token
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired refresh token'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.refreshToken = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    const { currentPassword, newPassword } = req.body;

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No user found with that email'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // In production, send email with reset token
    // For now, return the token
    res.status(200).json({
      success: true,
      resetToken
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const crypto = require('crypto');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
