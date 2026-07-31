const Plan = require('../models/Plan');
const Feature = require('../models/Feature');
const School = require('../models/School');
const Subscription = require('../models/Subscription');
const License = require('../models/License');
const FeatureFlag = require('../models/FeatureFlag');
const PricingSlab = require('../models/PricingSlab');
const RenewalRequest = require('../models/RenewalRequest');
const licenseService = require('../services/licenseService');
const subscriptionService = require('../services/subscriptionService');
const featureFlagService = require('../services/featureFlagService');
const pricingService = require('../services/pricingService');
const renewalService = require('../services/renewalService');
const usageService = require('../services/usageService');

// ==================== PLANS ====================

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const plan = await Plan.create({ ...req.body });
    res.status(201).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.status(200).json({ success: true, message: 'Plan deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== FEATURES ====================

exports.getFeatures = async (req, res) => {
  try {
    const features = await Feature.find({ isActive: true }).sort({ category: 1, order: 1 });
    res.status(200).json({ success: true, count: features.length, features });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createFeature = async (req, res) => {
  try {
    const feature = await featureFlagService.createFeature(req.body, req.user._id);
    res.status(201).json({ success: true, feature });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateFeature = async (req, res) => {
  try {
    const feature = await Feature.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!feature) return res.status(404).json({ success: false, error: 'Feature not found' });
    res.status(200).json({ success: true, feature });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteFeature = async (req, res) => {
  try {
    const feature = await Feature.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!feature) return res.status(404).json({ success: false, error: 'Feature not found' });
    res.status(200).json({ success: true, message: 'Feature deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== SUBSCRIPTIONS / LICENSES ====================

exports.getSchoolSubscription = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const subscription = await subscriptionService.getSubscription(tenantId);
    if (!subscription) return res.status(404).json({ success: false, error: 'Subscription not found' });
    res.status(200).json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSchoolLicense = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const license = await licenseService.getLicense(tenantId);
    if (!license) return res.status(404).json({ success: false, error: 'License not found' });
    res.status(200).json({ success: true, license });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateSchoolSubscription = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const subscription = await subscriptionService.updateSubscription(tenantId, req.body, req.user._id);
    res.status(200).json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateSchoolLicense = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const license = await licenseService.updateLicense(tenantId, req.body, req.user._id);
    res.status(200).json({ success: true, license });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.assignPlanToSchool = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { planCode, billingCycle = 'monthly', validUntil, trial = false } = req.body;

    const school = await School.findOne({ tenantId });
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    const plan = await Plan.findOne({ code: planCode.toLowerCase(), isActive: true });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

    const startDate = new Date();
    const expiryDate = validUntil
      ? new Date(validUntil)
      : subscriptionService.calculateExpiry(startDate, billingCycle);

    const subscription = await subscriptionService.updateSubscription(
      tenantId,
      {
        plan: planCode,
        planId: plan._id,
        startDate,
        expiryDate,
        renewalDate: expiryDate,
        billingCycle,
        agreedPrice: req.body.agreedPrice || plan.basePrice,
        discount: req.body.discount || 0,
        finalPrice: req.body.finalPrice || plan.basePrice,
        trialStatus: { isTrial: trial }
      },
      req.user._id
    );

    const license = await licenseService.activateLicenseFromPlan(tenantId, school._id, plan, {
      validFrom: startDate,
      validUntil: expiryDate,
      trial
    });

    await featureFlagService.bulkSetFeaturesFromPlan(tenantId, school._id, plan, req.user._id);

    res.status(200).json({
      success: true,
      subscription,
      license,
      message: `Plan ${plan.name} assigned to ${school.name}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== FEATURE FLAGS ====================

exports.getSchoolFeatures = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const school = await School.findOne({ tenantId });
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    const features = await featureFlagService.resolveTenantFeatures(tenantId, school._id);
    res.status(200).json({ success: true, features });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateSchoolFeature = async (req, res) => {
  try {
    const { tenantId, featureCode } = req.params;
    const { status, expiresAt, notes } = req.body;
    const school = await School.findOne({ tenantId });
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    const flag = await featureFlagService.setFeatureFlag(
      tenantId,
      school._id,
      featureCode,
      status,
      'manual',
      req.user._id,
      { expiresAt, notes }
    );

    res.status(200).json({ success: true, flag });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== PRICING SLABS ====================

exports.getPricingSlabs = async (req, res) => {
  try {
    const { plan = 'default' } = req.query;
    const slabs = await pricingService.getSlabs(plan);
    res.status(200).json({ success: true, count: slabs.length, slabs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createPricingSlab = async (req, res) => {
  try {
    const slab = await pricingService.createSlab(req.body, req.user._id);
    res.status(201).json({ success: true, slab });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updatePricingSlab = async (req, res) => {
  try {
    const slab = await pricingService.updateSlab(req.params.id, req.body, req.user._id);
    if (!slab) return res.status(404).json({ success: false, error: 'Pricing slab not found' });
    res.status(200).json({ success: true, slab });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deletePricingSlab = async (req, res) => {
  try {
    const slab = await pricingService.deleteSlab(req.params.id);
    if (!slab) return res.status(404).json({ success: false, error: 'Pricing slab not found' });
    res.status(200).json({ success: true, message: 'Pricing slab deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.calculatePrice = async (req, res) => {
  try {
    const { studentCount, billingCycle, plan = 'default' } = req.body;
    const result = await pricingService.calculatePrice(studentCount, billingCycle, plan);
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== RENEWAL REQUESTS ====================

exports.createRenewalRequest = async (req, res) => {
  try {
    const { tenantId, requestedPlan, requestedBillingCycle, requestedStudentCount, requestedFeatures } = req.body;
    const school = await School.findOne({ tenantId });
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    const request = await renewalService.createRenewalRequest({
      tenantId,
      schoolId: school._id,
      requestedPlan,
      requestedBillingCycle,
      requestedStudentCount,
      requestedFeatures
    }, req.user._id);

    res.status(201).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRenewalRequests = async (req, res) => {
  try {
    const { tenantId } = req.query;
    const requests = tenantId
      ? await renewalService.getRequestsForTenant(tenantId)
      : await renewalService.getPendingRequests();
    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveRenewalRequest = async (req, res) => {
  try {
    const { proposedPrice, proposedDiscount, finalPrice, adminNotes } = req.body;
    const request = await renewalService.approveRequest(req.params.id, { proposedPrice, proposedDiscount, finalPrice, adminNotes }, req.user._id);
    res.status(200).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.rejectRenewalRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const request = await renewalService.rejectRequest(req.params.id, rejectionReason, req.user._id);
    res.status(200).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.recordRenewalPayment = async (req, res) => {
  try {
    const request = await renewalService.recordPayment(req.params.id, req.body);
    res.status(200).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.activateRenewal = async (req, res) => {
  try {
    const { request, subscription, license } = await renewalService.activateRenewal(req.params.id, req.user._id);
    res.status(200).json({ success: true, request, subscription, license });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== USAGE / ANALYTICS ====================

exports.getTenantUsage = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const school = await School.findOne({ tenantId });
    const usage = await usageService.getTenantDashboardUsage(tenantId, school ? school._id : null);
    res.status(200).json({ success: true, usage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.snapshotTenantUsage = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const school = await School.findOne({ tenantId });
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    const metrics = await usageService.snapshotTenantUsage(tenantId, school._id);
    res.status(200).json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSuperAdminAnalytics = async (req, res) => {
  try {
    const totalSchools = await School.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ isActive: true });
    const expiredLicenses = await License.countDocuments({ 'status.expired': true });
    const pendingRenewals = await RenewalRequest.countDocuments({ status: 'pending' });
    const schools = await School.find({}).select('tenantId name');

    const schoolStatuses = [];
    for (const school of schools) {
      const sub = await subscriptionService.getSubscription(school.tenantId);
      const license = await licenseService.getLicense(school.tenantId);
      const usage = await usageService.getTenantDashboardUsage(school.tenantId, school._id);

      schoolStatuses.push({
        tenantId: school.tenantId,
        name: school.name,
        plan: sub?.plan || 'free',
        isActive: sub?.isActive || false,
        isExpired: sub ? subscriptionService.isExpired(sub) : true,
        licenseStatus: license?.status || {},
        usage
      });
    }

    res.status(200).json({
      success: true,
      analytics: {
        totalSchools,
        activeSubscriptions,
        expiredLicenses,
        pendingRenewals,
        schools: schoolStatuses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
