const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const License = require('../models/License');

const getSubscription = async (tenantId) => {
  return await Subscription.findOne({ tenantId });
};

const getOrCreateSubscription = async (tenantId, schoolId, planCode = 'free') => {
  let subscription = await Subscription.findOne({ tenantId });
  if (subscription) return subscription;

  const plan = await Plan.findOne({ code: planCode.toLowerCase() });

  subscription = await Subscription.create({
    tenantId,
    schoolId,
    plan: planCode,
    planId: plan ? plan._id : null,
    startDate: new Date(),
    billingCycle: 'monthly',
    agreedPrice: 0,
    discount: 0,
    finalPrice: 0,
    paymentStatus: 'waived',
    isActive: true
  });

  return subscription;
};

const createSubscription = async (data, userId) => {
  const plan = await Plan.findOne({ code: data.plan ? data.plan.toLowerCase() : 'free' });

  const subscription = await Subscription.create({
    ...data,
    planId: plan ? plan._id : null,
    createdBy: userId
  });

  return subscription;
};

const updateSubscription = async (tenantId, updates, userId) => {
  return await Subscription.findOneAndUpdate(
    { tenantId },
    { ...updates, updatedBy: userId },
    { new: true, upsert: true }
  );
};

const recordInvoice = async (tenantId, invoiceData) => {
  const subscription = await Subscription.findOne({ tenantId });
  if (!subscription) return null;

  subscription.invoiceHistory.push(invoiceData);

  if (invoiceData.status === 'paid') {
    subscription.paymentStatus = 'paid';
  } else if (invoiceData.status === 'partial') {
    subscription.paymentStatus = 'partial';
  } else if (invoiceData.status === 'overdue') {
    subscription.paymentStatus = 'overdue';
  }

  await subscription.save();
  return subscription;
};

const addRenewalHistory = async (tenantId, renewalData, userId) => {
  const subscription = await Subscription.findOne({ tenantId });
  if (!subscription) return null;

  subscription.renewalHistory.push({
    ...renewalData,
    activatedBy: userId,
    activatedAt: new Date()
  });

  await subscription.save();
  return subscription;
};

const calculateExpiry = (startDate, billingCycle) => {
  const date = new Date(startDate);
  switch (billingCycle) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'half_yearly':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'enterprise':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date;
};

const isExpired = (subscription) => {
  if (!subscription) return true;
  if (!subscription.expiryDate) return false;
  return new Date() > subscription.expiryDate;
};

module.exports = {
  getSubscription,
  getOrCreateSubscription,
  createSubscription,
  updateSubscription,
  recordInvoice,
  addRenewalHistory,
  calculateExpiry,
  isExpired
};
