const RenewalRequest = require('../models/RenewalRequest');
const License = require('../models/License');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const pricingService = require('./pricingService');
const licenseService = require('./licenseService');
const subscriptionService = require('./subscriptionService');

const createRenewalRequest = async (data, userId) => {
  return await RenewalRequest.create({
    ...data,
    requestedBy: userId,
    status: 'pending'
  });
};

const getRequestsForTenant = async (tenantId) => {
  return await RenewalRequest.find({ tenantId }).sort({ createdAt: -1 });
};

const getPendingRequests = async () => {
  return await RenewalRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
};

const approveRequest = async (requestId, adminUpdates, adminId) => {
  const request = await RenewalRequest.findById(requestId);
  if (!request) throw new Error('Renewal request not found');

  request.status = 'approved';
  request.proposedPrice = adminUpdates.proposedPrice;
  request.proposedDiscount = adminUpdates.proposedDiscount;
  request.finalPrice = adminUpdates.finalPrice;
  request.adminNotes = adminUpdates.adminNotes;
  request.updatedAt = new Date();

  await request.save();
  return request;
};

const rejectRequest = async (requestId, reason, adminId) => {
  const request = await RenewalRequest.findById(requestId);
  if (!request) throw new Error('Renewal request not found');

  request.status = 'rejected';
  request.rejectionReason = reason;
  request.updatedAt = new Date();

  await request.save();
  return request;
};

const recordPayment = async (requestId, paymentData) => {
  const request = await RenewalRequest.findById(requestId);
  if (!request) throw new Error('Renewal request not found');

  request.paymentStatus = 'paid';
  request.paymentDate = paymentData.paymentDate || new Date();
  request.paymentMode = paymentData.paymentMode;
  request.transactionId = paymentData.transactionId;
  request.status = 'waiting_for_payment';
  request.updatedAt = new Date();

  await request.save();
  return request;
};

const activateRenewal = async (requestId, adminId) => {
  const request = await RenewalRequest.findById(requestId);
  if (!request) throw new Error('Renewal request not found');

  const startDate = new Date();
  const expiryDate = subscriptionService.calculateExpiry(startDate, request.requestedBillingCycle);

  // Update subscription (commercial layer)
  const subscription = await subscriptionService.updateSubscription(
    request.tenantId,
    {
      plan: request.requestedPlan,
      billingCycle: request.requestedBillingCycle,
      startDate,
      expiryDate,
      renewalDate: expiryDate,
      agreedPrice: request.finalPrice,
      discount: request.proposedDiscount || 0,
      finalPrice: request.finalPrice,
      paymentStatus: 'paid'
    },
    adminId
  );

  // Build license limits based on plan and student count
  const plan = await Plan.findOne({ code: request.requestedPlan.toLowerCase() });
  let limits = {};
  if (plan) {
    limits = { ...(plan.defaultLimits || {}) };
  }
  if (request.requestedStudentCount) {
    limits.maxStudents = request.requestedStudentCount;
  }

  // Activate license (technical enforcement)
  const license = await License.findOneAndUpdate(
    { tenantId: request.tenantId },
    {
      tenantId: request.tenantId,
      schoolId: request.schoolId,
      subscriptionId: subscription ? subscription._id : null,
      limits,
      includedFeatures: plan
        ? (plan.defaultFeatures || [])
          .filter(f => f.status === 'enabled')
          .map(f => ({ featureCode: f.code.toUpperCase() }))
        : [],
      status: {
        active: true,
        suspended: false,
        expired: false,
        trial: false,
        readOnly: false,
        blocked: false
      },
      validFrom: startDate,
      validUntil: expiryDate,
      lastSyncedAt: new Date(),
      updatedBy: adminId
    },
    { new: true, upsert: true }
  );

  request.status = 'activated';
  request.activatedAt = new Date();
  request.activatedBy = adminId;
  request.activatedLicenseId = license._id;
  request.activatedSubscriptionId = subscription ? subscription._id : null;
  request.updatedAt = new Date();
  await request.save();

  return { request, subscription, license };
};

const calculateProposedPrice = async (studentCount, billingCycle, plan = 'default') => {
  return await pricingService.calculatePrice(studentCount, billingCycle, plan);
};

module.exports = {
  createRenewalRequest,
  getRequestsForTenant,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  recordPayment,
  activateRenewal,
  calculateProposedPrice
};
