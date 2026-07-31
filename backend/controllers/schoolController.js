const School = require('../models/School');
const User = require('../models/User');
const AcademicSession = require('../models/AcademicSession');
const Role = require('../models/Role');
const licenseService = require('../services/licenseService');
const subscriptionService = require('../services/subscriptionService');
const featureFlagService = require('../services/featureFlagService');
const Plan = require('../models/Plan');

// @desc    Create a new school (tenant)
// @route   POST /api/schools
// @access  Private (Super Admin only)
exports.createSchool = async (req, res) => {
  try {
    const { name, subdomain, address, contact, academicConfig } = req.body;

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

    const schoolData = { ...req.body, tenantId, subdomain: subdomain || tenantId, createdBy: req.user.id };
    const school = await School.create(schoolData);

    // Provision SaaS records for the new tenant
    const planCode = req.body.plan || 'free';
    const plan = await Plan.findOne({ code: planCode.toLowerCase() }) || await Plan.findOne({ code: 'free' });
    const startDate = new Date();
    const expiryDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await subscriptionService.updateSubscription(
      tenantId,
      {
        schoolId: school._id,
        plan: plan.code,
        planId: plan._id,
        startDate,
        expiryDate,
        renewalDate: expiryDate,
        billingCycle: 'monthly',
        agreedPrice: plan.basePrice,
        finalPrice: plan.basePrice,
        paymentStatus: 'waived',
        trialStatus: { isTrial: plan.code === 'free', trialEndsAt: expiryDate }
      },
      req.user._id
    );

    await licenseService.activateLicenseFromPlan(tenantId, school._id, plan, {
      validFrom: startDate,
      validUntil: expiryDate,
      trial: plan.code === 'free'
    });

    await featureFlagService.bulkSetFeaturesFromPlan(tenantId, school._id, plan, req.user._id);

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

    if (req.user.role !== 'super_admin' && school._id.toString() !== req.user.schoolId?.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this school'
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
        shortName: school.shortName,
        motto: school.motto,
        affiliation: school.affiliation,
        schoolCode: school.schoolCode,
        logo: school.logo,
        favicon: school.favicon,
        assets: school.assets,
        theme: school.theme,
        template: school.template,
        address: school.address,
        contact: school.contact,
        officials: school.officials,
        documentSettings: school.documentSettings,
        enabledModules: await featureFlagService.resolveTenantFeatures(school.tenantId, school._id),
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

    const update = { ...req.body };
    delete update.tenantId;
    delete update._id;

    school = await School.findByIdAndUpdate(
      req.params.id,
      update,
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

    if (req.user.role !== 'super_admin' && school._id.toString() !== req.user.schoolId?.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to customize this school'
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

    await school.deleteOne();

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

    if (req.user.role !== 'super_admin' && req.params.id !== req.user.schoolId?.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to view these stats' });
    }

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

// @desc    Onboard a new school tenant with admin and academic session
// @route   POST /api/schools/onboard
// @access  Private (Super Admin)
exports.onboardSchool = async (req, res) => {
  try {
    const { name, subdomain, address, contact, adminName, adminEmail, adminPassword, session } = req.body;

    const tenantId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-6);

    if (subdomain) {
      const existing = await School.findOne({ subdomain });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Subdomain already taken' });
      }
    }

    const schoolPayload = { ...req.body, tenantId, subdomain: subdomain || tenantId, createdBy: req.user.id };
    delete schoolPayload.adminName;
    delete schoolPayload.adminEmail;
    delete schoolPayload.adminPassword;
    delete schoolPayload.session;
    delete schoolPayload.plan;
    const school = await School.create(schoolPayload);

    // Provision SaaS records for the new tenant — always start on free trial
    const plan = await Plan.findOne({ code: 'free' });
    if (!plan) {
      return res.status(500).json({ success: false, error: 'No plans found. Please run SaaS seed script first.' });
    }
    const startDate = new Date();
    const expiryDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await subscriptionService.updateSubscription(
      tenantId,
      {
        schoolId: school._id,
        plan: 'free',
        planId: plan._id,
        startDate,
        expiryDate,
        renewalDate: expiryDate,
        billingCycle: 'monthly',
        agreedPrice: 0,
        finalPrice: 0,
        paymentStatus: 'waived',
        trialStatus: { isTrial: true, trialEndsAt: expiryDate }
      },
      req.user._id
    );

    await licenseService.activateLicenseFromPlan(tenantId, school._id, plan, {
      validFrom: startDate,
      validUntil: expiryDate,
      trial: true
    });

    await featureFlagService.bulkSetFeaturesFromPlan(tenantId, school._id, plan, req.user._id);

    // Copy system roles to this tenant
    const systemRoles = await Role.find({ isSystem: true, tenantId: { $exists: false } });
    const roleMap = new Map();
    for (const systemRole of systemRoles) {
      const role = await Role.create({
        name: systemRole.name,
        slug: systemRole.slug,
        tenantId: school.tenantId,
        schoolId: school._id,
        description: systemRole.description,
        isDefault: systemRole.isDefault,
        permissionCodes: systemRole.permissionCodes,
        permissions: systemRole.permissions
      });
      roleMap.set(systemRole.slug, role._id);
    }

    const schoolAdminRoleId = roleMap.get('school_admin');

    // Create admin user
    const admin = await User.create({
      name: adminName || `${name} Admin`,
      email: adminEmail,
      password: adminPassword,
      role: 'school_admin',
      roleId: schoolAdminRoleId,
      tenantId: school.tenantId,
      schoolId: school._id
    });

    // Create default academic session
    const start = session?.startDate ? new Date(session.startDate) : new Date();
    const end = session?.endDate ? new Date(session.endDate) : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
    const academicSession = await AcademicSession.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      name: session?.name || `${start.getFullYear()}-${String(end.getFullYear()).slice(-2)}`,
      code: session?.code || `${start.getFullYear()}-${end.getFullYear()}`,
      startDate: start,
      endDate: end,
      isCurrent: true,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      school,
      admin: { id: admin._id, email: admin.email },
      academicSession
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
