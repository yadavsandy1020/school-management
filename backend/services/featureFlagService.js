const Feature = require('../models/Feature');
const FeatureFlag = require('../models/FeatureFlag');
const License = require('../models/License');
const Plan = require('../models/Plan');

// --- Master feature catalog ---

const getAllFeatures = async (filters = {}) => {
  return await Feature.find({ isActive: true, ...filters }).sort({ category: 1, order: 1 });
};

const getFeatureByCode = async (code) => {
  return await Feature.findOne({ code: code.toUpperCase(), isActive: true });
};

const createFeature = async (data, userId) => {
  return await Feature.create({
    ...data,
    code: data.code.toUpperCase().trim()
  });
};

// --- Tenant feature resolution ---

const resolveTenantFeatures = async (tenantId, schoolId) => {
  const features = await getAllFeatures();
  const flags = await FeatureFlag.find({ tenantId });
  const license = await License.findOne({ tenantId });
  const flagMap = new Map(flags.map(f => [f.featureCode.toUpperCase(), f]));

  const result = [];

  for (const feature of features) {
    const code = feature.code.toUpperCase();
    let status = feature.defaultStatus;
    let source = 'plan';

    // License inclusion overrides default
    if (license) {
      const included = license.includedFeatures.find(f => f.featureCode === code);
      if (included) {
        status = 'enabled';
        source = 'license';
      }
    }

    // Tenant-level flag is the final override
    const flag = flagMap.get(code);
    if (flag) {
      status = flag.status;
      source = flag.source || source;
    }

    result.push({
      code,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      status,
      source,
      isAddOn: feature.isAddOn,
      addOnPrice: feature.addOnPrice,
      moduleCode: feature.moduleCode,
      icon: feature.icon,
      expiresAt: flag ? flag.expiresAt : null
    });
  }

  return result;
};

const getEnabledFeatures = async (tenantId, schoolId) => {
  const all = await resolveTenantFeatures(tenantId, schoolId);
  return all.filter(f => f.status === 'enabled' || f.status === 'beta');
};

const isFeatureEnabled = async (tenantId, schoolId, featureCode) => {
  const code = featureCode.toUpperCase();

  // First check explicit tenant flag
  const flag = await FeatureFlag.findOne({ tenantId, featureCode: code });
  if (flag) {
    return flag.status === 'enabled' || flag.status === 'beta';
  }

  // Then check license inclusion
  const license = await License.findOne({ tenantId });
  if (license) {
    const included = license.includedFeatures.find(f => f.featureCode === code);
    if (included) return true;
  }

  // Fall back to platform default
  const feature = await getFeatureByCode(code);
  if (!feature) return false;
  return feature.defaultStatus === 'enabled' || feature.defaultStatus === 'beta';
};

const setFeatureFlag = async (tenantId, schoolId, featureCode, status, source = 'manual', userId, options = {}) => {
  const code = featureCode.toUpperCase();

  const update = {
    tenantId,
    schoolId,
    featureCode: code,
    status,
    source,
    updatedBy: userId
  };

  if (status === 'enabled') {
    update.enabledAt = new Date();
    update.disabledAt = null;
  } else {
    update.disabledAt = new Date();
    update.enabledAt = null;
  }

  if (options.expiresAt) update.expiresAt = options.expiresAt;
  if (options.notes) update.notes = options.notes;

  return await FeatureFlag.findOneAndUpdate(
    { tenantId, featureCode: code },
    update,
    { new: true, upsert: true }
  );
};

const bulkSetFeaturesFromPlan = async (tenantId, schoolId, plan, userId) => {
  const features = await getAllFeatures();
  const planFeatures = new Map((plan.defaultFeatures || []).map(f => [f.code.toUpperCase(), f.status]));

  for (const feature of features) {
    const code = feature.code.toUpperCase();
    const planStatus = planFeatures.get(code);

    if (planStatus) {
      await setFeatureFlag(tenantId, schoolId, code, planStatus, 'plan', userId);
    }
  }
};

module.exports = {
  getAllFeatures,
  getFeatureByCode,
  createFeature,
  resolveTenantFeatures,
  getEnabledFeatures,
  isFeatureEnabled,
  setFeatureFlag,
  bulkSetFeaturesFromPlan
};
