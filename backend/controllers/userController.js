const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// @desc    Get all users (filtered by role and tenant)
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;
    const filter = {};

    // Super admin can see all users
    if (req.user.role !== 'super_admin') {
      filter.tenantId = req.user.tenantId;
      filter.schoolId = req.user.schoolId;
    }

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'super_admin' && 
        user.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this user'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'super_admin' && 
        req.user.role !== 'school_admin' &&
        req.user.id !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this user'
      });
    }

    const { name, phone, profile, studentDetails, teacherDetails, parentDetails } = req.body;

    user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, profile, studentDetails, teacherDetails, parentDetails },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'super_admin' && 
        req.user.role !== 'school_admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete users'
      });
    }

    // Don't allow deleting self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get students (with user info)
// @route   GET /api/users/students
// @access  Private
exports.getStudents = async (req, res) => {
  try {
    const { classId, section } = req.query;
    const filter = { role: 'student', isActive: true };

    if (req.user.role !== 'super_admin') {
      filter.tenantId = req.user.tenantId;
      filter.schoolId = req.user.schoolId;
    }

    if (classId) filter['studentDetails.classId'] = classId;
    if (section) filter['studentDetails.section'] = section;

    const students = await User.find(filter)
      .populate('studentDetails.classId', 'name sections')
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get teachers (with user info)
// @route   GET /api/users/teachers
// @access  Private
exports.getTeachers = async (req, res) => {
  try {
    const filter = { role: 'teacher', isActive: true };

    if (req.user.role !== 'super_admin') {
      filter.tenantId = req.user.tenantId;
      filter.schoolId = req.user.schoolId;
    }

    const teachers = await User.find(filter)
      .populate('teacherDetails.subjects', 'name code')
      .populate('teacherDetails.classTeacherFor', 'name')
      .select('-password')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Activate/Deactivate user
// @route   PUT /api/users/:id/status
// @access  Private (Admin only)
exports.updateUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'super_admin' && 
        req.user.role !== 'school_admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update user status'
      });
    }

    user.isActive = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
