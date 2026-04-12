const School = require('../models/School');
const User = require('../models/User');

// @desc    Create a new school (tenant)
// @route   POST /api/schools
// @access  Private (Super Admin only)
exports.createSchool = async (req, res) => {
  try {
    const { name, subdomain, address, contact, academicConfig, subscription } = req.body;

    // Generate tenant ID
    const tenantId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-6);

    // Check if subdomain already exists
    if (subdomain) {
      const existingSchool = await School.findOne({ subdomain });
      if (existingSchool) {
        return res.status(400).json({
          success: false,
          error: 'Subdomain already taken'
        });
      }
    }

    const school = await School.create({
      tenantId,
      name,
      subdomain: subdomain || tenantId,
      address,
      contact,
      academicConfig,
      subscription,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      school
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all schools
// @route   GET /api/schools
// @access  Private (Super Admin only)
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: schools.length,
      schools
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single school
// @route   GET /api/schools/:id
// @access  Private
exports.getSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    res.status(200).json({
      success: true,
      school
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get school by tenant ID
// @route   GET /api/schools/tenant/:tenantId
// @access  Public
exports.getSchoolByTenantId = async (req, res) => {
  try {
    const school = await School.findOne({ tenantId: req.params.tenantId });

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    res.status(200).json({
      success: true,
      school: {
        name: school.name,
        logo: school.logo,
        theme: school.theme,
        template: school.template,
        enabledModules: school.enabledModules,
        settings: school.settings
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

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Private (Super Admin or School Admin)
exports.updateSchool = async (req, res) => {
  try {
    let school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    // Authorization check
    if (req.user.role === 'school_admin' && school._id.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this school'
      });
    }

    const { name, address, contact, academicConfig, subscription, enabledModules, settings } = req.body;

    school = await School.findByIdAndUpdate(
      req.params.id,
      { name, address, contact, academicConfig, subscription, enabledModules, settings },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      school
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update school theme/customization
// @route   PUT /api/schools/:id/customization
// @access  Private (School Admin)
exports.updateCustomization = async (req, res) => {
  try {
    let school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    const { theme, template, logo } = req.body;

    school = await School.findByIdAndUpdate(
      req.params.id,
      { theme, template, logo },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      school
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Activate/Deactivate school
// @route   PUT /api/schools/:id/status
// @access  Private (Super Admin only)
exports.updateSchoolStatus = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    school.isActive = req.body.isActive !== undefined ? req.body.isActive : !school.isActive;
    await school.save();

    res.status(200).json({
      success: true,
      school
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete school
// @route   DELETE /api/schools/:id
// @access  Private (Super Admin only)
exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'School not found'
      });
    }

    // Also deactivate all users of this school
    await User.updateMany(
      { schoolId: school._id },
      { isActive: false }
    );

    await school.remove();

    res.status(200).json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get school statistics
// @route   GET /api/schools/:id/stats
// @access  Private (School Admin)
exports.getSchoolStats = async (req, res) => {
  try {
    const Student = require('../models/Student');
    const Teacher = require('../models/Teacher');
    const Class = require('../models/Class');

    const schoolId = req.params.id;

    const studentCount = await Student.countDocuments({ schoolId, isActive: true });
    const teacherCount = await Teacher.countDocuments({ schoolId, isActive: true });
    const classCount = await Class.countDocuments({ schoolId, isActive: true });
    const userCount = await User.countDocuments({ schoolId, isActive: true });

    res.status(200).json({
      success: true,
      stats: {
        students: studentCount,
        teachers: teacherCount,
        classes: classCount,
        users: userCount
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
