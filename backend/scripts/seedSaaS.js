require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const Feature = require('../models/Feature');
const PricingSlab = require('../models/PricingSlab');
const School = require('../models/School');
const Subscription = require('../models/Subscription');
const License = require('../models/License');
const FeatureFlag = require('../models/FeatureFlag');
const licenseService = require('../services/licenseService');
const subscriptionService = require('../services/subscriptionService');
const featureFlagService = require('../services/featureFlagService');

const defaultPlans = [
  {
    code: 'free',
    name: 'Free',
    description: 'Basic free trial plan with limited students.',
    defaultLimits: {
      maxStudents: 50,
      maxTeachers: 5,
      maxStaff: 5,
      maxBranches: 1,
      storageLimitMB: 100,
      apiLimitPerMonth: 1000,
      aiCredits: 0,
      smsCredits: 0,
      emailCredits: 50,
      maxActiveUsers: 60,
      reportExportLimit: 10
    },
    basePrice: 0,
    isPublic: true,
    order: 1
  },
  {
    code: 'basic',
    name: 'Basic',
    description: 'Small school plan with essential modules.',
    defaultLimits: {
      maxStudents: 300,
      maxTeachers: 20,
      maxStaff: 20,
      maxBranches: 1,
      storageLimitMB: 1000,
      apiLimitPerMonth: 10000,
      aiCredits: 100,
      smsCredits: 100,
      emailCredits: 500,
      maxActiveUsers: 350,
      reportExportLimit: 100
    },
    basePrice: 4999,
    isPublic: true,
    order: 2
  },
  {
    code: 'premium',
    name: 'Premium',
    description: 'Full-featured plan for growing schools.',
    defaultLimits: {
      maxStudents: 1000,
      maxTeachers: 75,
      maxStaff: 75,
      maxBranches: 3,
      storageLimitMB: 5000,
      apiLimitPerMonth: 50000,
      aiCredits: 500,
      smsCredits: 500,
      emailCredits: 2000,
      maxActiveUsers: 1200,
      reportExportLimit: 500
    },
    basePrice: 6999,
    isPublic: true,
    order: 3
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'Unlimited plan for large institutions and franchises.',
    defaultLimits: {
      maxStudents: -1,
      maxTeachers: -1,
      maxStaff: -1,
      maxBranches: -1,
      storageLimitMB: -1,
      apiLimitPerMonth: -1,
      aiCredits: -1,
      smsCredits: -1,
      emailCredits: -1,
      maxActiveUsers: -1,
      reportExportLimit: -1
    },
    basePrice: 7999,
    isPublic: true,
    order: 4
  }
];

const defaultFeatures = [
  { code: 'STUDENTS', name: 'Students', category: 'core', moduleCode: 'students', defaultStatus: 'enabled', order: 1 },
  { code: 'TEACHERS', name: 'Teachers', category: 'core', moduleCode: 'teachers', defaultStatus: 'enabled', order: 2 },
  { code: 'ATTENDANCE', name: 'Attendance', category: 'academic', moduleCode: 'attendance', defaultStatus: 'enabled', order: 3 },
  { code: 'FEES', name: 'Fees', category: 'finance', moduleCode: 'fees', defaultStatus: 'enabled', order: 4 },
  { code: 'ADMISSIONS', name: 'Admissions', category: 'academic', moduleCode: 'admissions', defaultStatus: 'enabled', order: 5 },
  { code: 'TIMETABLE', name: 'Timetable', category: 'academic', moduleCode: 'timetable', defaultStatus: 'enabled', order: 6 },
  { code: 'EXAMINATIONS', name: 'Examinations', category: 'academic', moduleCode: 'exams', defaultStatus: 'enabled', order: 7 },
  { code: 'LIBRARY', name: 'Library', category: 'academic', moduleCode: 'library', defaultStatus: 'disabled', order: 8 },
  { code: 'TRANSPORT', name: 'Transport', category: 'operations', moduleCode: 'transport', defaultStatus: 'disabled', order: 9 },
  { code: 'HOSTEL', name: 'Hostel', category: 'operations', moduleCode: 'hostel', defaultStatus: 'disabled', order: 10 },
  { code: 'INVENTORY', name: 'Inventory', category: 'operations', moduleCode: 'inventory', defaultStatus: 'disabled', order: 11 },
  { code: 'PAYROLL', name: 'Payroll', category: 'hr', moduleCode: 'payroll', defaultStatus: 'disabled', order: 12 },
  { code: 'HR', name: 'HR', category: 'hr', moduleCode: 'hr', defaultStatus: 'enabled', order: 13 },
  { code: 'AI', name: 'AI', category: 'premium', moduleCode: 'ai', defaultStatus: 'disabled', isAddOn: true, order: 14 },
  { code: 'SMS', name: 'SMS', category: 'communication', moduleCode: 'sms', defaultStatus: 'disabled', isAddOn: true, order: 15 },
  { code: 'EMAIL', name: 'Email', category: 'communication', moduleCode: 'email', defaultStatus: 'enabled', order: 16 },
  { code: 'WHATSAPP', name: 'WhatsApp', category: 'communication', moduleCode: 'whatsapp', defaultStatus: 'disabled', isAddOn: true, order: 17 },
  { code: 'BULK_MESSAGING', name: 'Bulk Messaging', category: 'communication', moduleCode: 'bulk_messaging', defaultStatus: 'disabled', isAddOn: true, order: 18 },
  { code: 'REPORTS', name: 'Reports', category: 'core', moduleCode: 'reports', defaultStatus: 'enabled', order: 19 },
  { code: 'ANALYTICS', name: 'Analytics', category: 'core', moduleCode: 'analytics', defaultStatus: 'enabled', order: 20 },
  { code: 'NOTICES', name: 'Notices', category: 'communication', moduleCode: 'notices', defaultStatus: 'enabled', order: 21 },
  { code: 'CALENDAR', name: 'Calendar', category: 'communication', moduleCode: 'calendar', defaultStatus: 'enabled', order: 22 },
  { code: 'ACADEMIC', name: 'Academic', category: 'academic', moduleCode: 'academic', defaultStatus: 'enabled', order: 23 },
  { code: 'FINANCE', name: 'Finance', category: 'finance', moduleCode: 'finance', defaultStatus: 'enabled', order: 24 },
  { code: 'CUSTOM_FIELDS', name: 'Custom Fields', category: 'core', moduleCode: 'custom_fields', defaultStatus: 'enabled', order: 25 },
  { code: 'CUSTOM_BRANDING', name: 'Custom Branding', category: 'premium', moduleCode: 'custom_branding', defaultStatus: 'disabled', isAddOn: true, order: 26 },
  { code: 'WHITE_LABEL', name: 'White Label', category: 'premium', moduleCode: 'white_label', defaultStatus: 'disabled', isAddOn: true, order: 27 },
  { code: 'ONLINE_ADMISSION', name: 'Online Admission', category: 'premium', moduleCode: 'online_admission', defaultStatus: 'disabled', isAddOn: true, order: 28 },
  { code: 'ONLINE_FEE_PAYMENT', name: 'Online Fee Payment', category: 'premium', moduleCode: 'online_fee_payment', defaultStatus: 'disabled', isAddOn: true, order: 29 },
  { code: 'DOCUMENT_GENERATOR', name: 'Document Generator', category: 'core', moduleCode: 'document_generator', defaultStatus: 'enabled', order: 30 },
  { code: 'CERTIFICATES', name: 'Certificates', category: 'academic', moduleCode: 'certificates', defaultStatus: 'enabled', order: 31 },
  { code: 'STUDENT_PORTAL', name: 'Student Portal', category: 'portal', moduleCode: 'student_portal', defaultStatus: 'enabled', order: 32 },
  { code: 'PARENT_PORTAL', name: 'Parent Portal', category: 'portal', moduleCode: 'parent_portal', defaultStatus: 'enabled', order: 33 },
  { code: 'TEACHER_PORTAL', name: 'Teacher Portal', category: 'portal', moduleCode: 'teacher_portal', defaultStatus: 'enabled', order: 34 },
  { code: 'LEAVE_MANAGEMENT', name: 'Leave Management', category: 'hr', moduleCode: 'leave_management', defaultStatus: 'enabled', order: 35 },
  { code: 'VISITOR_MANAGEMENT', name: 'Visitor Management', category: 'operations', moduleCode: 'visitor_management', defaultStatus: 'disabled', isAddOn: true, order: 36 },
  { code: 'FRONT_OFFICE', name: 'Front Office', category: 'operations', moduleCode: 'front_office', defaultStatus: 'disabled', isAddOn: true, order: 37 },
  { code: 'ALUMNI', name: 'Alumni', category: 'premium', moduleCode: 'alumni', defaultStatus: 'disabled', isAddOn: true, order: 38 },
  { code: 'FRANCHISE', name: 'Franchise', category: 'premium', moduleCode: 'franchise', defaultStatus: 'disabled', isAddOn: true, order: 39 },
  { code: 'SCHOOL_WEBSITE', name: 'School Website', category: 'premium', moduleCode: 'school_website', defaultStatus: 'disabled', isAddOn: true, order: 40 },
  { code: 'BIOMETRIC', name: 'Biometric', category: 'premium', moduleCode: 'biometric', defaultStatus: 'coming_soon', order: 41 },
  { code: 'GPS', name: 'GPS', category: 'premium', moduleCode: 'gps', defaultStatus: 'coming_soon', order: 42 }
];

const defaultPricingSlabs = [
  { plan: 'basic', minStudents: 0, maxStudents: 100, monthlyPrice: 999, quarterlyPrice: 2799, halfYearlyPrice: 5499, yearlyPrice: 9999, enterprisePrice: 0 },
  { plan: 'basic', minStudents: 101, maxStudents: 300, monthlyPrice: 1499, quarterlyPrice: 4199, halfYearlyPrice: 8299, yearlyPrice: 14999, enterprisePrice: 0 },
  { plan: 'premium', minStudents: 0, maxStudents: 300, monthlyPrice: 2499, quarterlyPrice: 6999, halfYearlyPrice: 13999, yearlyPrice: 24999, enterprisePrice: 0 },
  { plan: 'premium', minStudents: 301, maxStudents: 500, monthlyPrice: 3499, quarterlyPrice: 9799, halfYearlyPrice: 19599, yearlyPrice: 34999, enterprisePrice: 0 },
  { plan: 'premium', minStudents: 501, maxStudents: 1000, monthlyPrice: 4999, quarterlyPrice: 13999, halfYearlyPrice: 27999, yearlyPrice: 49999, enterprisePrice: 0 },
  { plan: 'premium', minStudents: 1001, maxStudents: 999999, monthlyPrice: 0, quarterlyPrice: 0, halfYearlyPrice: 0, yearlyPrice: 0, enterprisePrice: 0 }
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedPlans = async () => {
  for (const plan of defaultPlans) {
    await Plan.findOneAndUpdate(
      { code: plan.code },
      plan,
      { upsert: true, new: true }
    );
  }
  console.log('Plans seeded');
};

const seedFeatures = async () => {
  for (const feature of defaultFeatures) {
    await Feature.findOneAndUpdate(
      { code: feature.code },
      feature,
      { upsert: true, new: true }
    );
  }
  console.log('Features seeded');
};

const seedPricingSlabs = async () => {
  for (const slab of defaultPricingSlabs) {
    await PricingSlab.findOneAndUpdate(
      { plan: slab.plan, minStudents: slab.minStudents, maxStudents: slab.maxStudents },
      slab,
      { upsert: true, new: true }
    );
  }
  console.log('Pricing slabs seeded');
};

const migrateExistingSchools = async () => {
  const schools = await School.find({});
  for (const school of schools) {
    const tenantId = school.tenantId;

    // Read legacy fields from raw document (removed from School schema)
    const raw = await School.collection.findOne({ _id: school._id });
    const oldSubscription = raw?.subscription || {};
    const oldEnabledModules = raw?.enabledModules || {};

    // Determine existing plan from old School.subscription
    const oldPlan = oldSubscription.plan || 'free';
    const plan = await Plan.findOne({ code: oldPlan.toLowerCase() }) || await Plan.findOne({ code: 'free' });

    // Create/update subscription
    let subscription = await Subscription.findOne({ tenantId });
    if (!subscription) {
      const startDate = oldSubscription.startDate || new Date();
      const expiryDate = oldSubscription.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      subscription = await Subscription.create({
        tenantId,
        schoolId: school._id,
        plan: plan.code,
        planId: plan._id,
        startDate,
        expiryDate,
        renewalDate: expiryDate,
        billingCycle: 'monthly',
        agreedPrice: plan.basePrice,
        discount: 0,
        finalPrice: plan.basePrice,
        paymentStatus: plan.basePrice === 0 ? 'waived' : 'pending',
        isActive: oldSubscription.isActive !== false
      });
    }

    // Create/update license
    const license = await License.findOne({ tenantId });
    if (!license) {
      const limits = { ...plan.defaultLimits };
      if (oldSubscription.plan === 'enterprise') {
        Object.keys(limits).forEach(k => limits[k] = -1);
      }

      await License.create({
        tenantId,
        schoolId: school._id,
        subscriptionId: subscription._id,
        limits,
        includedFeatures: (plan.defaultFeatures || [])
          .filter(f => f.status === 'enabled')
          .map(f => ({ featureCode: f.code })),
        status: {
          active: true,
          suspended: false,
          expired: false,
          trial: plan.code === 'free',
          readOnly: false,
          blocked: false
        },
        validFrom: subscription.startDate,
        validUntil: subscription.expiryDate
      });
    }

    // Create feature flags from old enabledModules
    const enabledModules = oldEnabledModules || {};
    for (const [moduleName, enabled] of Object.entries(enabledModules)) {
      const featureCode = moduleName.toUpperCase();
      const feature = await Feature.findOne({ code: featureCode });
      if (feature) {
        await FeatureFlag.findOneAndUpdate(
          { tenantId, featureCode },
          {
            tenantId,
            schoolId: school._id,
            featureCode,
            status: enabled ? 'enabled' : 'disabled',
            source: 'manual'
          },
          { upsert: true, new: true }
        );
      }
    }
  }
  console.log(`Migrated ${schools.length} schools`);
};

const run = async () => {
  await connectDB();
  await seedPlans();
  await seedFeatures();
  await seedPricingSlabs();
  console.log('SaaS seed complete — use onboarding to create schools');
  process.exit(0);
};

run();
