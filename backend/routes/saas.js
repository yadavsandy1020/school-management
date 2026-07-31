const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
  getSchoolSubscription,
  getSchoolLicense,
  updateSchoolSubscription,
  updateSchoolLicense,
  assignPlanToSchool,
  getSchoolFeatures,
  updateSchoolFeature,
  getPricingSlabs,
  createPricingSlab,
  updatePricingSlab,
  deletePricingSlab,
  calculatePrice,
  createRenewalRequest,
  getRenewalRequests,
  approveRenewalRequest,
  rejectRenewalRequest,
  recordRenewalPayment,
  activateRenewal,
  getTenantUsage,
  snapshotTenantUsage,
  getSuperAdminAnalytics
} = require('../controllers/saasController');

// Plans
router.get('/plans', protect, requireRole('super_admin'), getPlans);
router.get('/plans/:id', protect, requireRole('super_admin'), getPlanById);
router.post('/plans', protect, requireRole('super_admin'), createPlan);
router.put('/plans/:id', protect, requireRole('super_admin'), updatePlan);
router.delete('/plans/:id', protect, requireRole('super_admin'), deletePlan);

// Features catalog
router.get('/features', protect, requireRole('super_admin'), getFeatures);
router.post('/features', protect, requireRole('super_admin'), createFeature);
router.put('/features/:id', protect, requireRole('super_admin'), updateFeature);
router.delete('/features/:id', protect, requireRole('super_admin'), deleteFeature);

// Subscriptions & Licenses per tenant
router.get('/subscriptions/:tenantId', protect, requireRole('super_admin'), getSchoolSubscription);
router.put('/subscriptions/:tenantId', protect, requireRole('super_admin'), updateSchoolSubscription);
router.get('/licenses/:tenantId', protect, requireRole('super_admin'), getSchoolLicense);
router.put('/licenses/:tenantId', protect, requireRole('super_admin'), updateSchoolLicense);
router.post('/schools/:tenantId/assign-plan', protect, requireRole('super_admin'), assignPlanToSchool);

// Feature flags per tenant
router.get('/feature-flags/:tenantId', protect, requireRole('super_admin'), getSchoolFeatures);
router.put('/feature-flags/:tenantId/:featureCode', protect, requireRole('super_admin'), updateSchoolFeature);

// Pricing slabs
router.get('/pricing-slabs', protect, requireRole('super_admin'), getPricingSlabs);
router.post('/pricing-slabs', protect, requireRole('super_admin'), createPricingSlab);
router.put('/pricing-slabs/:id', protect, requireRole('super_admin'), updatePricingSlab);
router.delete('/pricing-slabs/:id', protect, requireRole('super_admin'), deletePricingSlab);
router.post('/pricing/calculate', protect, requireRole('super_admin'), calculatePrice);

// Renewal workflow
router.post('/renewals', protect, createRenewalRequest);
router.get('/renewals', protect, requireRole('super_admin'), getRenewalRequests);
router.put('/renewals/:id/approve', protect, requireRole('super_admin'), approveRenewalRequest);
router.put('/renewals/:id/reject', protect, requireRole('super_admin'), rejectRenewalRequest);
router.put('/renewals/:id/payment', protect, requireRole('super_admin'), recordRenewalPayment);
router.put('/renewals/:id/activate', protect, requireRole('super_admin'), activateRenewal);

// Usage & analytics
router.get('/usage/:tenantId', protect, getTenantUsage);
router.post('/usage/:tenantId/snapshot', protect, snapshotTenantUsage);
router.get('/analytics/super-admin', protect, requireRole('super_admin'), getSuperAdminAnalytics);

module.exports = router;
