const License = require('../models/License');
const Subscription = require('../models/Subscription');
const UsageMetric = require('../models/UsageMetric');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Employee = require('../models/Employee');
const User = require('../models/User');

// --- Status helpers ---

const isLicenseActive = (license) => {
  if (!license) return false;
  const now = new Date();

  if (license.status.blocked) return false;
  if (license.status.suspended) return false;
  if (license.validUntil && now > license.validUntil) {
    license.status.expired = true;
    license.status.readOnly = true;
  }
  if (license.status.expired && !license.status.trial) return false;

  return license.status.active !== false;
};

const isReadOnly = (license) => {
  if (!license) return false;
  const now = new Date();
  if (license.status.readOnly) return true;
  if (license.validUntil && now > license.validUntil) return true;
  if (license.status.expired) return true;
  return false;
};

// --- Getters ---

const getLicense = async (tenantId) => {
  return await License.findOne({ tenantId });
};

const getOrCreateLicense = async (tenantId, schoolId, planDefaults = {}) => {
  let license = await License.findOne({ tenantId });
  if (license) return license;

  license = await License.create({
    tenantId,
    schoolId,
    limits: {
      maxStudents: planDefaults.maxStudents || 100,
      maxTeachers: planDefaults.maxTeachers || 10,
      maxStaff: planDefaults.maxStaff || 10,
      maxBranches: planDefaults.maxBranches || 1,
      storageLimitMB: planDefaults.storageLimitMB || 500,
      apiLimitPerMonth: planDefaults.apiLimitPerMonth || 10000,
      aiCredits: planDefaults.aiCredits || 0,
      smsCredits: planDefaults.smsCredits || 0,
      emailCredits: planDefaults.emailCredits || 0,
      maxActiveUsers: planDefaults.maxActiveUsers || 0,
      reportExportLimit: planDefaults.reportExportLimit || 100
    },
    status: {
      active: true,
      trial: true
    },
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14-day trial
  });

  return license;
};

const validateLicense = async (tenantId) => {
  const license = await getLicense(tenantId);
  return {
    valid: isLicenseActive(license),
    readOnly: isReadOnly(license),
    license
  };
};

const checkLicenseStatus = async (tenantId) => {
  const result = await validateLicense(tenantId);
  return result;
};

// --- Usage counts ---

const getCurrentStudentCount = async (tenantId, schoolId) => {
  return await Student.countDocuments({ tenantId, schoolId, isActive: true });
};

const getCurrentTeacherCount = async (tenantId, schoolId) => {
  return await Teacher.countDocuments({ tenantId, schoolId, isActive: true });
};

const getCurrentEmployeeCount = async (tenantId, schoolId) => {
  return await Employee.countDocuments({ tenantId, schoolId, isActive: true });
};

const getCurrentActiveUserCount = async (tenantId) => {
  return await User.countDocuments({ tenantId, isActive: true });
};

const getStorageUsedMB = async (tenantId) => {
  const latest = await UsageMetric.findOne({ tenantId, metric: 'storage_mb', period: 'instant' })
    .sort({ recordedAt: -1 });
  return latest ? latest.value : 0;
};

// --- Limit checks ---

const checkStudentLimit = async (tenantId, schoolId, requestedCount = 1) => {
  const license = await getLicense(tenantId);
  if (!license) return { allowed: false, reason: 'No license found' };

  const current = await getCurrentStudentCount(tenantId, schoolId);
  const limit = license.limits.maxStudents || 0;

  if (limit === 0 || limit === -1) return { allowed: true, current, limit, remaining: -1 };
  const remaining = limit - current;

  if (requestedCount > remaining) {
    return {
      allowed: false,
      current,
      limit,
      remaining,
      reason: 'Your school has reached the licensed student capacity.\n\nPlease contact EduPilot to upgrade your subscription.\n\nNo data has been modified.'
    };
  }

  return { allowed: true, current, limit, remaining: remaining - requestedCount };
};

const checkTeacherLimit = async (tenantId, schoolId, requestedCount = 1) => {
  const license = await getLicense(tenantId);
  if (!license) return { allowed: false, reason: 'No license found' };

  const current = await getCurrentTeacherCount(tenantId, schoolId);
  const limit = license.limits.maxTeachers || 0;

  if (limit === 0 || limit === -1) return { allowed: true, current, limit, remaining: -1 };
  const remaining = limit - current;

  if (requestedCount > remaining) {
    return { allowed: false, current, limit, remaining, reason: 'Teacher limit exceeded. Please upgrade your license.' };
  }

  return { allowed: true, current, limit, remaining: remaining - requestedCount };
};

const checkStaffLimit = async (tenantId, schoolId, requestedCount = 1) => {
  const license = await getLicense(tenantId);
  if (!license) return { allowed: false, reason: 'No license found' };

  const current = await getCurrentEmployeeCount(tenantId, schoolId);
  const limit = license.limits.maxStaff || 0;

  if (limit === 0 || limit === -1) return { allowed: true, current, limit, remaining: -1 };
  const remaining = limit - current;

  if (requestedCount > remaining) {
    return { allowed: false, current, limit, remaining, reason: 'Staff/employee limit exceeded. Please upgrade your license.' };
  }

  return { allowed: true, current, limit, remaining: remaining - requestedCount };
};

const checkStorageLimit = async (tenantId, additionalMB = 0) => {
  const license = await getLicense(tenantId);
  if (!license) return { allowed: false, reason: 'No license found' };

  const current = await getStorageUsedMB(tenantId);
  const limit = license.limits.storageLimitMB || 0;

  if (limit === 0 || limit === -1) return { allowed: true, current, limit, remaining: -1 };
  const remaining = limit - current;

  if (additionalMB > remaining) {
    return { allowed: false, current, limit, remaining, reason: 'Storage limit exceeded. Please purchase additional storage.' };
  }

  return { allowed: true, current, limit, remaining: remaining - additionalMB };
};

const checkAICredits = async (tenantId, requestedCredits = 1) => {
  const license = await getLicense(tenantId);
  if (!license) return { allowed: false, reason: 'No license found' };

  const current = await getUsageForPeriod(tenantId, 'ai_requests');
  const limit = license.limits.aiCredits || 0;

  if (limit === 0 || limit === -1) return { allowed: true, current, limit, remaining: -1 };
  const remaining = limit - current;

  if (requestedCredits > remaining) {
    return { allowed: false, current, limit, remaining, reason: 'AI credit limit exceeded. Please purchase AI credits.' };
  }

  return { allowed: true, current, limit, remaining: remaining - requestedCredits };
};

// --- Feature included in license ---

const isFeatureIncluded = async (tenantId, featureCode) => {
  const license = await getLicense(tenantId);
  if (!license) return false;
  return license.includedFeatures.some(
    f => f.featureCode === featureCode.toUpperCase()
  );
};

// --- Helpers for usage service ---

const getUsageForPeriod = async (tenantId, metric, period = 'monthly') => {
  const latest = await UsageMetric.findOne({ tenantId, metric, period })
    .sort({ recordedAt: -1 });
  return latest ? latest.value : 0;
};

// --- Activation / update ---

const activateLicenseFromPlan = async (tenantId, schoolId, plan, options = {}) => {
  const defaults = plan.defaultLimits || {};

  const update = {
    tenantId,
    schoolId,
    limits: {
      maxStudents: defaults.maxStudents ?? 0,
      maxTeachers: defaults.maxTeachers ?? 0,
      maxStaff: defaults.maxStaff ?? 0,
      maxBranches: defaults.maxBranches ?? 1,
      storageLimitMB: defaults.storageLimitMB ?? 0,
      apiLimitPerMonth: defaults.apiLimitPerMonth ?? 0,
      aiCredits: defaults.aiCredits ?? 0,
      smsCredits: defaults.smsCredits ?? 0,
      emailCredits: defaults.emailCredits ?? 0,
      maxActiveUsers: defaults.maxActiveUsers ?? 0,
      reportExportLimit: defaults.reportExportLimit ?? 0
    },
    includedFeatures: (plan.defaultFeatures || [])
      .filter(f => f.status === 'enabled')
      .map(f => ({ featureCode: f.code.toUpperCase() })),
    status: {
      active: true,
      suspended: false,
      expired: false,
      trial: options.trial || false,
      readOnly: false,
      blocked: false
    },
    validFrom: options.validFrom || new Date(),
    validUntil: options.validUntil || null,
    lastSyncedAt: new Date()
  };

  const license = await License.findOneAndUpdate(
    { tenantId },
    update,
    { new: true, upsert: true }
  );

  return license;
};

const updateLicense = async (tenantId, updateData, userId) => {
  return await License.findOneAndUpdate(
    { tenantId },
    { ...updateData, updatedBy: userId, lastSyncedAt: new Date() },
    { new: true, upsert: true }
  );
};

module.exports = {
  getLicense,
  getOrCreateLicense,
  validateLicense,
  checkLicenseStatus,
  isLicenseActive,
  isReadOnly,
  checkStudentLimit,
  checkTeacherLimit,
  checkStaffLimit,
  checkStorageLimit,
  checkAICredits,
  isFeatureIncluded,
  getCurrentStudentCount,
  getCurrentTeacherCount,
  getCurrentEmployeeCount,
  getCurrentActiveUserCount,
  getStorageUsedMB,
  getUsageForPeriod,
  activateLicenseFromPlan,
  updateLicense
};
