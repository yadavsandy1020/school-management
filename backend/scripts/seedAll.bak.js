const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Models
const AcademicSession = require('../models/AcademicSession');
const Admission = require('../models/Admission');
const Attendance = require('../models/Attendance');
const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const CalendarEvent = require('../models/CalendarEvent');
const Class = require('../models/Class');
const Department = require('../models/Department');
const Driver = require('../models/Driver');
const Employee = require('../models/Employee');
const Exam = require('../models/Exam');
const ExamType = require('../models/ExamType');
const FeeInvoice = require('../models/FeeInvoice');
const FeeStructure = require('../models/FeeStructure');
const GradeSystem = require('../models/GradeSystem');
const Hostel = require('../models/Hostel');
const HostelAllocation = require('../models/HostelAllocation');
const HostelRoom = require('../models/HostelRoom');
const InventoryItem = require('../models/InventoryItem');
const Leave = require('../models/Leave');
const MarksEntry = require('../models/MarksEntry');
const Notice = require('../models/Notice');
const PaymentTransaction = require('../models/PaymentTransaction');
const Payroll = require('../models/Payroll');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const Route = require('../models/Route');
const School = require('../models/School');
const SchoolExpense = require('../models/SchoolExpense');
const StockMovement = require('../models/StockMovement');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const TeacherSalaryPayment = require('../models/TeacherSalaryPayment');
const Timetable = require('../models/Timetable');
const TransportAllocation = require('../models/TransportAllocation');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Feature = require('../models/Feature');
const FeatureFlag = require('../models/FeatureFlag');
const Plan = require('../models/Plan');
const PricingSlab = require('../models/PricingSlab');
const License = require('../models/License');
const Subscription = require('../models/Subscription');
const UsageMetric = require('../models/UsageMetric');
const RenewalRequest = require('../models/RenewalRequest');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// --- Helpers ---
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const today = new Date();

// --- RBAC ---
const seedRbac = async () => {
  const permissions = [
    { code: 'DASHBOARD_VIEW', name: 'View Dashboard', module: 'dashboard', category: 'dashboard' },
    { code: 'STUDENT_VIEW', name: 'View Students', module: 'students', category: 'students' },
    { code: 'STUDENT_CREATE', name: 'Create Student', module: 'students', category: 'students' },
    { code: 'STUDENT_UPDATE', name: 'Update Student', module: 'students', category: 'students' },
    { code: 'STUDENT_DELETE', name: 'Delete Student', module: 'students', category: 'students' },
    { code: 'TEACHER_VIEW', name: 'View Teachers', module: 'teachers', category: 'teachers' },
    { code: 'TEACHER_CREATE', name: 'Create Teacher', module: 'teachers', category: 'teachers' },
    { code: 'CLASS_VIEW', name: 'View Classes', module: 'academic', category: 'academic' },
    { code: 'CLASS_MANAGE', name: 'Manage Classes', module: 'academic', category: 'academic' },
    { code: 'ATTENDANCE_VIEW', name: 'View Attendance', module: 'attendance', category: 'attendance' },
    { code: 'ATTENDANCE_MARK', name: 'Mark Attendance', module: 'attendance', category: 'attendance' },
    { code: 'FEE_STRUCTURE_VIEW', name: 'View Fee Structure', module: 'fees', category: 'fees' },
    { code: 'FEE_STRUCTURE_MANAGE', name: 'Manage Fee Structure', module: 'fees', category: 'fees' },
    { code: 'FEE_INVOICE_VIEW', name: 'View Invoices', module: 'fees', category: 'fees' },
    { code: 'FEE_INVOICE_CREATE', name: 'Create Invoice', module: 'fees', category: 'fees' },
    { code: 'FEE_PAYMENT_RECORD', name: 'Record Payment', module: 'fees', category: 'fees' },
    { code: 'FINANCE_VIEW', name: 'View Finance', module: 'finance', category: 'finance' },
    { code: 'FINANCE_MANAGE', name: 'Manage Finance', module: 'finance', category: 'finance' },
    { code: 'LIBRARY_VIEW', name: 'View Library', module: 'library', category: 'library' },
    { code: 'LIBRARY_MANAGE', name: 'Manage Library', module: 'library', category: 'library' },
    { code: 'TRANSPORT_VIEW', name: 'View Transport', module: 'transport', category: 'transport' },
    { code: 'TRANSPORT_MANAGE', name: 'Manage Transport', module: 'transport', category: 'transport' },
    { code: 'HOSTEL_VIEW', name: 'View Hostel', module: 'hostel', category: 'hostel' },
    { code: 'HOSTEL_MANAGE', name: 'Manage Hostel', module: 'hostel', category: 'hostel' },
    { code: 'EMPLOYEE_VIEW', name: 'View Employees', module: 'hrms', category: 'hrms' },
    { code: 'EMPLOYEE_MANAGE', name: 'Manage Employees', module: 'hrms', category: 'hrms' },
    { code: 'PAYROLL_MANAGE', name: 'Manage Payroll', module: 'hrms', category: 'hrms' },
    { code: 'INVENTORY_VIEW', name: 'View Inventory', module: 'inventory', category: 'inventory' },
    { code: 'INVENTORY_MANAGE', name: 'Manage Inventory', module: 'inventory', category: 'inventory' },
    { code: 'NOTICE_VIEW', name: 'View Notices', module: 'communication', category: 'communication' },
    { code: 'NOTICE_CREATE', name: 'Create Notice', module: 'communication', category: 'communication' },
    { code: 'REPORT_VIEW', name: 'View Reports', module: 'reports', category: 'reports' },
    { code: 'REPORT_EXPORT', name: 'Export Reports', module: 'reports', category: 'reports' },
    { code: 'SETTINGS_VIEW', name: 'View Settings', module: 'settings', category: 'settings' },
    { code: 'SETTINGS_MANAGE', name: 'Manage Settings', module: 'settings', category: 'settings' },
    { code: 'ROLE_MANAGE', name: 'Manage Roles', module: 'settings', category: 'settings' },
    { code: 'USER_MANAGE', name: 'Manage Users', module: 'settings', category: 'settings' },
    { code: 'AUDIT_LOG_VIEW', name: 'View Audit Logs', module: 'settings', category: 'settings' },
    { code: 'SMS_SEND', name: 'Send SMS', module: 'communication', category: 'communication' },
    { code: 'EMAIL_SEND', name: 'Send Email', module: 'communication', category: 'communication' },
    { code: '*', name: 'Super Admin All Access', module: 'system', category: 'system', isSystem: true }
  ];

  for (const perm of permissions) {
    await Permission.findOneAndUpdate({ code: perm.code }, { ...perm, isActive: true }, { upsert: true, new: true });
  }

  const allPermissions = await Permission.find({ isActive: true });
  const codeToId = new Map(allPermissions.map(p => [p.code, p._id]));

  const roles = [
    { name: 'Super Admin', slug: 'super_admin', isSystem: true, permissionCodes: ['*'] },
    { name: 'School Admin', slug: 'school_admin', isDefault: true, permissionCodes: permissions.filter(p => !p.isSystem && p.code !== '*').map(p => p.code) },
    { name: 'Teacher', slug: 'teacher', isDefault: true, permissionCodes: ['DASHBOARD_VIEW', 'STUDENT_VIEW', 'CLASS_VIEW', 'ATTENDANCE_VIEW', 'ATTENDANCE_MARK', 'NOTICE_VIEW', 'REPORT_VIEW'] },
    { name: 'Accountant', slug: 'accountant', isDefault: true, permissionCodes: ['DASHBOARD_VIEW', 'STUDENT_VIEW', 'TEACHER_VIEW', 'FEE_STRUCTURE_VIEW', 'FEE_STRUCTURE_MANAGE', 'FEE_INVOICE_VIEW', 'FEE_INVOICE_CREATE', 'FEE_PAYMENT_RECORD', 'FINANCE_VIEW', 'FINANCE_MANAGE', 'REPORT_VIEW', 'REPORT_EXPORT'] },
    { name: 'Receptionist', slug: 'receptionist', isDefault: true, permissionCodes: ['DASHBOARD_VIEW', 'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_UPDATE', 'TEACHER_VIEW', 'ATTENDANCE_VIEW', 'NOTICE_VIEW'] },
    { name: 'Student', slug: 'student', isDefault: true, permissionCodes: ['DASHBOARD_VIEW', 'STUDENT_VIEW', 'NOTICE_VIEW'] },
    { name: 'Parent', slug: 'parent', isDefault: true, permissionCodes: ['DASHBOARD_VIEW', 'STUDENT_VIEW', 'NOTICE_VIEW', 'ATTENDANCE_VIEW'] }
  ];

  for (const role of roles) {
    const permissionIds = role.permissionCodes.map(code => codeToId.get(code)).filter(Boolean);
    await Role.findOneAndUpdate(
      { slug: role.slug, tenantId: { $exists: false } },
      { ...role, permissions: permissionIds, isActive: true },
      { upsert: true, new: true }
    );
  }

  console.log(`Seeded ${permissions.length} permissions and ${roles.length} system roles`);
};

// --- SaaS ---
const seedSaaS = async () => {
  const plans = [
    { code: 'free', name: 'Free', description: 'Free trial', defaultLimits: { maxStudents: 50, maxTeachers: 5, maxStaff: 5, maxBranches: 1, storageLimitMB: 100, apiLimitPerMonth: 1000, aiCredits: 0, smsCredits: 0, emailCredits: 50, maxActiveUsers: 60, reportExportLimit: 10 }, basePrice: 0, isPublic: true, order: 1 },
    { code: 'basic', name: 'Basic', description: 'Small schools', defaultLimits: { maxStudents: 300, maxTeachers: 20, maxStaff: 20, maxBranches: 1, storageLimitMB: 1000, apiLimitPerMonth: 10000, aiCredits: 100, smsCredits: 100, emailCredits: 500, maxActiveUsers: 350, reportExportLimit: 100 }, basePrice: 999, isPublic: true, order: 2 },
    { code: 'premium', name: 'Premium', description: 'Full features', defaultLimits: { maxStudents: 1000, maxTeachers: 75, maxStaff: 75, maxBranches: 3, storageLimitMB: 5000, apiLimitPerMonth: 50000, aiCredits: 500, smsCredits: 500, emailCredits: 2000, maxActiveUsers: 1200, reportExportLimit: 500 }, basePrice: 2499, isPublic: true, order: 3 },
    { code: 'enterprise', name: 'Enterprise', description: 'Unlimited', defaultLimits: { maxStudents: -1, maxTeachers: -1, maxStaff: -1, maxBranches: -1, storageLimitMB: -1, apiLimitPerMonth: -1, aiCredits: -1, smsCredits: -1, emailCredits: -1, maxActiveUsers: -1, reportExportLimit: -1 }, basePrice: 0, isPublic: true, order: 4 }
  ];

  for (const plan of plans) {
    await Plan.findOneAndUpdate({ code: plan.code }, plan, { upsert: true, new: true });
  }

  const features = [
    { code: 'STUDENTS', name: 'Students', category: 'core', defaultStatus: 'enabled', order: 1 },
    { code: 'TEACHERS', name: 'Teachers', category: 'core', defaultStatus: 'enabled', order: 2 },
    { code: 'ATTENDANCE', name: 'Attendance', category: 'academic', defaultStatus: 'enabled', order: 3 },
    { code: 'FEES', name: 'Fees', category: 'finance', defaultStatus: 'enabled', order: 4 },
    { code: 'ADMISSIONS', name: 'Admissions', category: 'academic', defaultStatus: 'enabled', order: 5 },
    { code: 'TIMETABLE', name: 'Timetable', category: 'academic', defaultStatus: 'enabled', order: 6 },
    { code: 'EXAMINATIONS', name: 'Examinations', category: 'academic', defaultStatus: 'enabled', order: 7 },
    { code: 'LIBRARY', name: 'Library', category: 'academic', defaultStatus: 'enabled', order: 8 },
    { code: 'TRANSPORT', name: 'Transport', category: 'operations', defaultStatus: 'enabled', order: 9 },
    { code: 'HOSTEL', name: 'Hostel', category: 'operations', defaultStatus: 'enabled', order: 10 },
    { code: 'INVENTORY', name: 'Inventory', category: 'operations', defaultStatus: 'enabled', order: 11 },
    { code: 'PAYROLL', name: 'Payroll', category: 'hr', defaultStatus: 'enabled', order: 12 },
    { code: 'HR', name: 'HR', category: 'hr', defaultStatus: 'enabled', order: 13 },
    { code: 'AI', name: 'AI', category: 'premium', defaultStatus: 'enabled', order: 14 },
    { code: 'SMS', name: 'SMS', category: 'communication', defaultStatus: 'enabled', order: 15 },
    { code: 'EMAIL', name: 'Email', category: 'communication', defaultStatus: 'enabled', order: 16 },
    { code: 'WHATSAPP', name: 'WhatsApp', category: 'communication', defaultStatus: 'enabled', order: 17 },
    { code: 'BULK_MESSAGING', name: 'Bulk Messaging', category: 'communication', defaultStatus: 'enabled', order: 18 },
    { code: 'REPORTS', name: 'Reports', category: 'core', defaultStatus: 'enabled', order: 19 },
    { code: 'ANALYTICS', name: 'Analytics', category: 'core', defaultStatus: 'enabled', order: 20 },
    { code: 'NOTICES', name: 'Notices', category: 'communication', defaultStatus: 'enabled', order: 21 },
    { code: 'CALENDAR', name: 'Calendar', category: 'communication', defaultStatus: 'enabled', order: 22 },
    { code: 'ACADEMIC', name: 'Academic', category: 'academic', defaultStatus: 'enabled', order: 23 },
    { code: 'FINANCE', name: 'Finance', category: 'finance', defaultStatus: 'enabled', order: 24 },
    { code: 'CUSTOM_FIELDS', name: 'Custom Fields', category: 'core', defaultStatus: 'enabled', order: 25 },
    { code: 'CUSTOM_BRANDING', name: 'Custom Branding', category: 'premium', defaultStatus: 'enabled', order: 26 },
    { code: 'DOCUMENT_GENERATOR', name: 'Document Generator', category: 'core', defaultStatus: 'enabled', order: 27 },
    { code: 'CERTIFICATES', name: 'Certificates', category: 'academic', defaultStatus: 'enabled', order: 28 },
    { code: 'STUDENT_PORTAL', name: 'Student Portal', category: 'portal', defaultStatus: 'enabled', order: 29 },
    { code: 'PARENT_PORTAL', name: 'Parent Portal', category: 'portal', defaultStatus: 'enabled', order: 30 },
    { code: 'TEACHER_PORTAL', name: 'Teacher Portal', category: 'portal', defaultStatus: 'enabled', order: 31 },
    { code: 'LEAVE_MANAGEMENT', name: 'Leave Management', category: 'hr', defaultStatus: 'enabled', order: 32 },
    { code: 'ONLINE_ADMISSION', name: 'Online Admission', category: 'premium', defaultStatus: 'enabled', order: 33 },
    { code: 'ONLINE_FEE_PAYMENT', name: 'Online Fee Payment', category: 'premium', defaultStatus: 'enabled', order: 34 },
    { code: 'SCHOOL_WEBSITE', name: 'School Website', category: 'premium', defaultStatus: 'enabled', order: 35 }
  ];

  for (const feature of features) {
    await Feature.findOneAndUpdate({ code: feature.code }, feature, { upsert: true, new: true });
  }

  const slabs = [
    { plan: 'basic', minStudents: 0, maxStudents: 100, monthlyPrice: 999, quarterlyPrice: 2799, halfYearlyPrice: 5499, yearlyPrice: 9999, enterprisePrice: 0 },
    { plan: 'basic', minStudents: 101, maxStudents: 300, monthlyPrice: 1499, quarterlyPrice: 4199, halfYearlyPrice: 8299, yearlyPrice: 14999, enterprisePrice: 0 },
    { plan: 'premium', minStudents: 0, maxStudents: 300, monthlyPrice: 2499, quarterlyPrice: 6999, halfYearlyPrice: 13999, yearlyPrice: 24999, enterprisePrice: 0 },
    { plan: 'premium', minStudents: 301, maxStudents: 500, monthlyPrice: 3499, quarterlyPrice: 9799, halfYearlyPrice: 19599, yearlyPrice: 34999, enterprisePrice: 0 },
    { plan: 'premium', minStudents: 501, maxStudents: 1000, monthlyPrice: 4999, quarterlyPrice: 13999, halfYearlyPrice: 27999, yearlyPrice: 49999, enterprisePrice: 0 },
    { plan: 'premium', minStudents: 1001, maxStudents: 999999, monthlyPrice: 0, quarterlyPrice: 0, halfYearlyPrice: 0, yearlyPrice: 0, enterprisePrice: 0 }
  ];

  for (const slab of slabs) {
    await PricingSlab.findOneAndUpdate({ plan: slab.plan, minStudents: slab.minStudents, maxStudents: slab.maxStudents }, slab, { upsert: true, new: true });
  }

  console.log(`Seeded ${plans.length} plans, ${features.length} features, ${slabs.length} pricing slabs`);
  return { plans, features };
};

// --- Main seed ---
const run = async () => {
  await connectDB();

  console.log('Dropping all collections...');
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const col of collections) {
    await mongoose.connection.db.dropCollection(col.name);
    console.log(`  Dropped ${col.name}`);
  }

  await seedRbac();
  const { plans, features } = await seedSaaS();

  // Create Super Admin
  const superAdminRole = await Role.findOne({ slug: 'super_admin', tenantId: { $exists: false } });
  const superAdmin = await User.create({
    name: 'Super Admin',
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@schoolsaas.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'admin123456',
    role: 'super_admin',
    roleId: superAdminRole._id
  });

  // Create Demo School
  const premiumPlan = plans.find(p => p.code === 'premium');
  const school = await School.create({
    tenantId: 'shikohabad',
    name: 'Rigveda Academy',
    shortName: 'Rigveda',
    subdomain: 'rigveda',
    schoolCode: 'RVD-001',
    address: { street: 'Mela Bagh, Near Rahul Dairy', city: 'Shikohabad', state: 'Uttar Pradesh', pincode: '283135', country: 'India' },
    contact: { phone: '+91-9876543210', email: 'info@rigveda.com', website: 'www.rigveda.com' },
    academicConfig: { currentSession: '2024-25', sessionStartMonth: 'April' },
    plan: 'premium'
  });

  // Create Subscription and License
  const startDate = new Date();
  const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await Subscription.create({
    tenantId: school.tenantId,
    schoolId: school._id,
    plan: 'premium',
    planId: premiumPlan._id,
    startDate,
    expiryDate,
    renewalDate: expiryDate,
    billingCycle: 'yearly',
    agreedPrice: 49999,
    finalPrice: 49999,
    paymentStatus: 'paid'
  });

  await License.create({
    tenantId: school.tenantId,
    schoolId: school._id,
    limits: { maxStudents: 1000, maxTeachers: 75, maxStaff: 75, maxBranches: 3, storageLimitMB: 5000, apiLimitPerMonth: 50000, aiCredits: 500, smsCredits: 500, emailCredits: 2000, maxActiveUsers: 1200, reportExportLimit: 500 },
    includedFeatures: features.filter(f => f.defaultStatus === 'enabled').map(f => ({ featureCode: f.code })),
    status: { active: true, suspended: false, expired: false, trial: false, readOnly: false, blocked: false },
    validFrom: startDate,
    validUntil: expiryDate
  });

  // Create feature flags
  for (const feature of features) {
    await FeatureFlag.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      featureCode: feature.code,
      status: feature.defaultStatus,
      source: 'plan'
    });
  }

  // System + tenant roles
  const schoolAdminRole = await Role.findOne({ slug: 'school_admin', tenantId: { $exists: false } });
  const teacherRole = await Role.findOne({ slug: 'teacher', tenantId: { $exists: false } });
  const accountantRole = await Role.findOne({ slug: 'accountant', tenantId: { $exists: false } });
  const receptionistRole = await Role.findOne({ slug: 'receptionist', tenantId: { $exists: false } });
  const studentRole = await Role.findOne({ slug: 'student', tenantId: { $exists: false } });
  const parentRole = await Role.findOne({ slug: 'parent', tenantId: { $exists: false } });

  const copyRole = async (systemRole, tenantId, schoolId) => {
    return await Role.create({
      name: systemRole.name,
      slug: systemRole.slug,
      tenantId,
      schoolId,
      description: systemRole.description,
      isDefault: systemRole.isDefault,
      permissionCodes: systemRole.permissionCodes,
      permissions: systemRole.permissions,
      isActive: true
    });
  };

  const tenantSchoolAdminRole = await copyRole(schoolAdminRole, school.tenantId, school._id);
  const tenantTeacherRole = await copyRole(teacherRole, school.tenantId, school._id);
  const tenantAccountantRole = await copyRole(accountantRole, school.tenantId, school._id);

  // Users
  const schoolAdmin = await User.create({ name: 'School Admin', email: 'schooladmin@rigveda.com', password: 'admin123', role: 'school_admin', roleId: tenantSchoolAdminRole._id, tenantId: school.tenantId, schoolId: school._id });
  const accountant = await User.create({ name: 'Accountant', email: 'accountant@rigveda.com', password: 'accountant123', role: 'school_admin', roleId: tenantAccountantRole._id, tenantId: school.tenantId, schoolId: school._id });

  // Academic Session
  const academicSession = await AcademicSession.create({
    tenantId: school.tenantId,
    schoolId: school._id,
    name: '2024-25',
    code: '2024-2025',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2025-03-31'),
    isCurrent: true
  });

  // Classes & Subjects
  const classData = [];
  const classNames = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
  for (const name of classNames) {
    const sections = name.startsWith('Class') ? ['A', 'B'] : ['A'];
    const cls = await Class.create({ name, sections, tenantId: school.tenantId, schoolId: school._id, capacity: 40, academicSession: academicSession.name });
    classData.push(cls);
  }

  const subjects = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science', 'Computer', 'Drawing', 'Physical Education'];
  const subjectDocs = [];
  for (const name of subjects) {
    const sub = await Subject.create({ name, code: name.toUpperCase().replace(' ', '_'), tenantId: school.tenantId, schoolId: school._id });
    subjectDocs.push(sub);
  }

  // Teachers
  const teachers = [];
  const teacherUsers = [];
  const firstNames = ['Amit', 'Sunita', 'Rahul', 'Pooja', 'Vikas', 'Neha', 'Sanjay', 'Anita', 'Manoj', 'Priya'];
  const lastNames = ['Sharma', 'Verma', 'Singh', 'Gupta', 'Yadav', 'Agarwal', 'Patel', 'Khan', 'Joshi', 'Rao'];
  for (let i = 0; i < 10; i++) {
    const user = await User.create({
      name: `${firstNames[i]} ${lastNames[i]}`,
      email: `teacher${i + 1}@rigveda.com`,
      password: 'teacher123',
      role: 'teacher',
      roleId: tenantTeacherRole._id,
      tenantId: school.tenantId,
      schoolId: school._id
    });
    const t = await Teacher.create({
      userId: user._id,
      employeeId: `EMP${String(i + 1).padStart(3, '0')}`,
      tenantId: school.tenantId,
      schoolId: school._id,
      personalInfo: { firstName: firstNames[i], lastName: lastNames[i], dateOfBirth: randomDate(new Date('1975-01-01'), new Date('1990-12-31')), gender: i % 2 === 0 ? 'male' : 'female' },
      contactInfo: { phone: `+91-98${Math.floor(10000000 + Math.random() * 90000000)}`, email: user.email },
      employmentDetails: { joinDate: randomDate(new Date('2015-01-01'), new Date('2023-12-31')), designation: 'Teacher', department: 'Academic' },
      salaryDetails: { basicSalary: 25000, totalSalary: 25000 },
      isActive: true
    });
    teachers.push(t);
    teacherUsers.push(user);
  }

  // Students
  const students = [];
  const genders = ['male', 'female'];
  for (let i = 0; i < 60; i++) {
    const cls = random(classData);
    const section = random(cls.sections);
    const gender = random(genders);
    const fname = gender === 'male' ? random(['Rahul', 'Amit', 'Vikas', 'Manoj', 'Sanjay', 'Arjun', 'Karan', 'Rohan']) : random(['Pooja', 'Sunita', 'Neha', 'Anita', 'Priya', 'Kavita', 'Divya', 'Sneha']);
    const lname = random(lastNames);
    const student = await Student.create({
      admissionNo: `RVD-2024-${String(i + 1).padStart(3, '0')}`,
      tenantId: school.tenantId,
      schoolId: school._id,
      classId: cls._id,
      section,
      academicSession: academicSession.name,
      personalInfo: { firstName: fname, lastName: lname, dateOfBirth: randomDate(new Date('2010-01-01'), new Date('2018-12-31')), gender },
      contactInfo: { phone: `+91-98${Math.floor(10000000 + Math.random() * 90000000)}`, address: { street: 'Demo Colony', city: 'Shikohabad', state: 'Uttar Pradesh', pincode: '283135' } },
      parentInfo: { fatherName: `Mr. ${random(lastNames)}`, fatherPhone: `+91-98${Math.floor(10000000 + Math.random() * 90000000)}`, fatherOccupation: 'Business' },
      isActive: true
    });
    students.push(student);
    cls.currentStrength = (cls.currentStrength || 0) + 1;
    await cls.save();
  }

  // Fee Structure
  const feeStructures = [];
  for (const cls of classData.slice(0, 8)) {
    const fs = await FeeStructure.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      classId: cls._id,
      academicSession: academicSession.name,
      name: `${cls.name} Annual Fee`,
      components: [
        { name: 'Tuition Fee', amount: 1500, frequency: 'monthly' },
        { name: 'Admission Fee', amount: 2000, frequency: 'yearly' },
        { name: 'Examination Fee', amount: 500, frequency: 'yearly' }
      ],
      totalAmount: 20000
    });
    feeStructures.push(fs);
  }

  // Fee Invoices and Payments
  const invoices = [];
  for (let i = 0; i < 20; i++) {
    const student = random(students);
    const fs = random(feeStructures);
    const invoice = await FeeInvoice.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      studentId: student._id,
      classId: student.classId,
      feeStructureId: fs._id,
      academicSession: academicSession.name,
      invoiceNumber: `INV-${String(i + 1).padStart(4, '0')}`,
      amount: fs.totalAmount,
      paidAmount: i % 3 === 0 ? fs.totalAmount : (i % 3 === 1 ? fs.totalAmount / 2 : 0),
      status: i % 3 === 0 ? 'paid' : (i % 3 === 1 ? 'partial' : 'pending'),
      dueDate: new Date('2024-05-15')
    });
    invoices.push(invoice);

    if (invoice.paidAmount > 0) {
      await PaymentTransaction.create({
        tenantId: school.tenantId,
        schoolId: school._id,
        invoiceId: invoice._id,
        studentId: student._id,
        amount: invoice.paidAmount,
        paymentMode: random(['cash', 'online', 'bank_transfer']),
        transactionId: `TXN-${String(i + 1).padStart(5, '0')}`,
        status: 'completed',
        paymentDate: new Date()
      });
    }
  }

  // Attendance
  for (let i = 0; i < 30; i++) {
    const student = random(students);
    await Attendance.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      studentId: student._id,
      classId: student.classId,
      section: student.section,
      date: randomDate(new Date('2024-04-01'), today),
      status: random(['present', 'present', 'present', 'absent']),
      markedBy: random(teacherUsers)._id
    });
  }

  // Admissions
  for (let i = 0; i < 10; i++) {
    await Admission.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      applicationNo: `ADM-${String(i + 1).padStart(4, '0')}`,
      academicSession: academicSession.name,
      applyingForClass: random(classData)._id,
      personalInfo: { firstName: random(firstNames), lastName: random(lastNames), dateOfBirth: randomDate(new Date('2015-01-01'), new Date('2019-12-31')), gender: random(genders) },
      contactInfo: { phone: `+91-98${Math.floor(10000000 + Math.random() * 90000000)}` },
      status: random(['pending', 'approved', 'rejected', 'enrolled']),
      applicationDate: new Date()
    });
  }

  // Exam Types & Grade System
  const examType = await ExamType.create({ tenantId: school.tenantId, schoolId: school._id, name: 'Mid Term', code: 'MID', maxMarks: 100, passingMarks: 33 });
  const gradeSystem = await GradeSystem.create({ tenantId: school.tenantId, schoolId: school._id, name: 'Standard Grades', grades: [{ grade: 'A', minMarks: 80, maxMarks: 100 }, { grade: 'B', minMarks: 60, maxMarks: 79 }, { grade: 'C', minMarks: 40, maxMarks: 59 }, { grade: 'D', minMarks: 33, maxMarks: 39 }, { grade: 'F', minMarks: 0, maxMarks: 32 }] });

  // Exams
  const exam = await Exam.create({
    tenantId: school.tenantId,
    schoolId: school._id,
    name: 'Mid Term Examination 2024',
    examTypeId: examType._id,
    classId: classData[3]._id,
    section: 'A',
    subjectId: subjectDocs[2]._id,
    academicSession: academicSession.name,
    maxMarks: 100,
    passingMarks: 33,
    examDate: new Date('2024-09-15'),
    status: 'published'
  });

  for (const student of students.slice(0, 10)) {
    const marks = Math.floor(Math.random() * 70) + 30;
    await MarksEntry.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      examId: exam._id,
      studentId: student._id,
      classId: classData[3]._id,
      section: 'A',
      subjectId: subjectDocs[2]._id,
      marksObtained: marks,
      maxMarks: 100,
      grade: marks >= 80 ? 'A' : marks >= 60 ? 'B' : marks >= 40 ? 'C' : marks >= 33 ? 'D' : 'F'
    });
  }

  // Library
  const books = [];
  const bookTitles = ['Mathematics Class 5', 'Science Class 6', 'English Grammar', 'Hindi Sahitya', 'Social Studies', 'Computer Basics', 'General Knowledge', 'Moral Stories'];
  for (let i = 0; i < 20; i++) {
    const book = await Book.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      bookNo: `BK-${String(i + 1).padStart(4, '0')}`,
      title: random(bookTitles),
      author: random(['NCERT', 'R. S. Sharma', 'S. Chand', 'Oswaal']),
      category: random(['Academic', 'Story', 'Reference']),
      quantity: 5,
      available: i % 5 === 0 ? 4 : 5
    });
    books.push(book);
  }

  for (let i = 0; i < 5; i++) {
    const book = random(books);
    await BookIssue.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      bookId: book._id,
      studentId: random(students)._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'issued'
    });
  }

  // Transport
  const vehicle = await Vehicle.create({ tenantId: school.tenantId, schoolId: school._id, vehicleNo: 'UP-78-AB-1234', type: 'Bus', capacity: 40, model: 'Tata Starbus' });
  const driver = await Driver.create({ tenantId: school.tenantId, schoolId: school._id, name: 'Ramesh Yadav', phone: '+91-9876543220', licenseNo: 'UP-12345678' });
  const route = await Route.create({ tenantId: school.tenantId, schoolId: school._id, name: 'Shikohabad City', vehicleId: vehicle._id, driverId: driver._id, stops: [{ name: 'Main Chowk', fare: 500 }, { name: 'Railway Station', fare: 700 }] });
  for (let i = 0; i < 8; i++) {
    await TransportAllocation.create({ tenantId: school.tenantId, schoolId: school._id, studentId: random(students)._id, routeId: route._id, stopName: random(['Main Chowk', 'Railway Station']) });
  }

  // Hostel
  const hostel = await Hostel.create({ tenantId: school.tenantId, schoolId: school._id, name: 'Boys Hostel', type: 'boys', wardenName: 'Suresh Singh', wardenPhone: '+91-9876543230' });
  const rooms = [];
  for (let i = 0; i < 10; i++) {
    const room = await HostelRoom.create({ tenantId: school.tenantId, schoolId: school._id, hostelId: hostel._id, roomNo: `10${i + 1}`, capacity: 4, occupied: i < 3 ? 1 : 0 });
    rooms.push(room);
  }
  for (let i = 0; i < 3; i++) {
    await HostelAllocation.create({ tenantId: school.tenantId, schoolId: school._id, studentId: students[i]._id, hostelId: hostel._id, roomId: rooms[i]._id, allocationDate: new Date() });
  }

  // Inventory
  const inventoryItems = [];
  const items = ['Chalk Box', 'Whiteboard Marker', 'A4 Paper Ream', 'Desk', 'Chair', 'Projector', 'Computer Mouse', 'Printer Cartridge'];
  for (let i = 0; i < 10; i++) {
    const item = await InventoryItem.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      name: random(items),
      category: random(['Stationery', 'Furniture', 'Electronics']),
      quantity: Math.floor(Math.random() * 50) + 10,
      unit: random(['box', 'piece', 'ream']),
      threshold: 5
    });
    inventoryItems.push(item);
  }

  for (let i = 0; i < 5; i++) {
    await StockMovement.create({ tenantId: school.tenantId, schoolId: school._id, itemId: random(inventoryItems)._id, type: random(['in', 'out']), quantity: Math.floor(Math.random() * 5) + 1, date: new Date() });
  }

  // HRMS / Employees
  const departments = [];
  for (const name of ['Academic', 'Administration', 'Finance', 'Transport', 'Library']) {
    departments.push(await Department.create({ tenantId: school.tenantId, schoolId: school._id, name }));
  }

  const employees = [];
  for (let i = 0; i < 8; i++) {
    const emp = await Employee.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      employeeId: `STF${String(i + 1).padStart(3, '0')}`,
      department: random(departments).name,
      designation: random(['Clerk', 'Librarian', 'Driver', 'Accountant', 'Manager']),
      joiningDate: randomDate(new Date('2018-01-01'), new Date('2023-12-31')),
      salary: 15000 + Math.floor(Math.random() * 20000),
      isActive: true
    });
    employees.push(emp);
  }

  // Payroll
  for (const emp of employees.slice(0, 4)) {
    await Payroll.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      employeeId: emp._id,
      month: 'April',
      year: 2024,
      basicSalary: emp.employment.salary,
      deductions: { pf: 1000, tax: 500 },
      netSalary: emp.employment.salary - 1500,
      status: 'paid'
    });
  }

  // Leaves
  for (let i = 0; i < 5; i++) {
    await Leave.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      employeeId: random(employees)._id,
      leaveType: random(['sick', 'casual']),
      startDate: new Date('2024-05-01'),
      endDate: new Date('2024-05-03'),
      reason: 'Personal work',
      status: random(['approved', 'pending'])
    });
  }

  // Teacher Salary Payments
  for (let i = 0; i < 5; i++) {
    await TeacherSalaryPayment.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      teacherId: random(teachers)._id,
      month: 'April',
      year: 2024,
      amount: 25000,
      paymentDate: new Date('2024-05-01'),
      paymentMode: 'bank_transfer'
    });
  }

  // School Expenses
  for (let i = 0; i < 6; i++) {
    await SchoolExpense.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      title: random(['Electricity Bill', 'Stationery Purchase', 'Maintenance', 'Transport Fuel', 'Annual Day Expenses']),
      amount: Math.floor(Math.random() * 5000) + 1000,
      category: random(['Utilities', 'Stationery', 'Maintenance', 'Transport', 'Events']),
      date: randomDate(new Date('2024-04-01'), today),
      paymentMode: random(['cash', 'online'])
    });
  }

  // Notices
  for (let i = 0; i < 8; i++) {
    await Notice.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      title: random(['Annual Day Notice', 'Exam Schedule', 'Holiday Notice', 'Fee Payment Reminder', 'Parent Teacher Meeting']),
      content: 'This is a sample notice generated for testing.',
      createdBy: schoolAdmin._id,
      audience: random(['all', 'teachers', 'parents', 'students']),
      isActive: true
    });
  }

  // Calendar Events
  for (let i = 0; i < 6; i++) {
    await CalendarEvent.create({
      tenantId: school.tenantId,
      schoolId: school._id,
      title: random(['Annual Day', 'Sports Day', 'Independence Day', 'Republic Day', 'Parent Teacher Meeting']),
      description: 'Sample calendar event.',
      startDate: randomDate(new Date('2024-08-01'), new Date('2025-03-31')),
      endDate: randomDate(new Date('2024-08-01'), new Date('2025-03-31')),
      type: random(['holiday', 'event', 'exam']),
      audience: 'all'
    });
  }

  // Timetable
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [{ start: '08:00', end: '08:40' }, { start: '08:45', end: '09:25' }, { start: '09:30', end: '10:10' }];
  for (const day of days) {
    for (let p = 0; p < periods.length; p++) {
      await Timetable.create({
        tenantId: school.tenantId,
        schoolId: school._id,
        classId: classData[3]._id,
        section: 'A',
        day,
        period: p + 1,
        startTime: periods[p].start,
        endTime: periods[p].end,
        subjectId: random(subjectDocs)._id,
        teacherId: random(teachers)._id,
        academicSession: academicSession.name
      });
    }
  }

  // Usage Metrics
  for (const metric of ['students', 'teachers', 'employees', 'classes', 'invoices', 'payments_collected', 'attendance_records']) {
    await UsageMetric.create({ tenantId: school.tenantId, schoolId: school._id, metric, value: metric === 'students' ? students.length : metric === 'teachers' ? teachers.length : metric === 'employees' ? employees.length : metric === 'classes' ? classData.length : 0, period: 'instant' });
  }

  // Renewal Request
  await RenewalRequest.create({
    tenantId: school.tenantId,
    schoolId: school._id,
    requestedBy: schoolAdmin._id,
    status: 'pending',
    requestedPlan: 'premium',
    requestedBillingCycle: 'yearly',
    requestedStudentCount: 500
  });

  console.log('\n=== Sample Data Created ===');
  console.log('Super Admin: admin@schoolsaas.com / admin123456');
  console.log('School Admin: schooladmin@rigveda.com / admin123');
  console.log('School Tenant ID: shikohabad');
  process.exit(0);
};

run();
