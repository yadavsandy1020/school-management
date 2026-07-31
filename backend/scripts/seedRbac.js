const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const Role = require('../models/Role');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const defaultPermissions = [
  // Dashboard
  { code: 'DASHBOARD_VIEW', name: 'View Dashboard', module: 'dashboard', category: 'dashboard' },

  // Students
  { code: 'STUDENT_VIEW', name: 'View Students', module: 'students', category: 'students' },
  { code: 'STUDENT_CREATE', name: 'Create Student', module: 'students', category: 'students' },
  { code: 'STUDENT_UPDATE', name: 'Update Student', module: 'students', category: 'students' },
  { code: 'STUDENT_DELETE', name: 'Delete Student', module: 'students', category: 'students' },
  { code: 'STUDENT_BULK_IMPORT', name: 'Bulk Import Students', module: 'students', category: 'students' },
  { code: 'STUDENT_BULK_EXPORT', name: 'Bulk Export Students', module: 'students', category: 'students' },
  { code: 'STUDENT_PROMOTE', name: 'Promote Student', module: 'students', category: 'students' },

  // Teachers
  { code: 'TEACHER_VIEW', name: 'View Teachers', module: 'teachers', category: 'teachers' },
  { code: 'TEACHER_CREATE', name: 'Create Teacher', module: 'teachers', category: 'teachers' },
  { code: 'TEACHER_UPDATE', name: 'Update Teacher', module: 'teachers', category: 'teachers' },
  { code: 'TEACHER_DELETE', name: 'Delete Teacher', module: 'teachers', category: 'teachers' },

  // Academic
  { code: 'CLASS_VIEW', name: 'View Classes', module: 'academic', category: 'academic' },
  { code: 'CLASS_MANAGE', name: 'Manage Classes', module: 'academic', category: 'academic' },
  { code: 'SUBJECT_VIEW', name: 'View Subjects', module: 'academic', category: 'academic' },
  { code: 'SUBJECT_MANAGE', name: 'Manage Subjects', module: 'academic', category: 'academic' },
  { code: 'TIMETABLE_VIEW', name: 'View Timetable', module: 'academic', category: 'academic' },
  { code: 'TIMETABLE_MANAGE', name: 'Manage Timetable', module: 'academic', category: 'academic' },

  // Attendance
  { code: 'ATTENDANCE_VIEW', name: 'View Attendance', module: 'attendance', category: 'attendance' },
  { code: 'ATTENDANCE_MARK', name: 'Mark Attendance', module: 'attendance', category: 'attendance' },
  { code: 'ATTENDANCE_REPORT', name: 'Attendance Reports', module: 'attendance', category: 'attendance' },

  // Fees
  { code: 'FEE_STRUCTURE_VIEW', name: 'View Fee Structure', module: 'fees', category: 'fees' },
  { code: 'FEE_STRUCTURE_MANAGE', name: 'Manage Fee Structure', module: 'fees', category: 'fees' },
  { code: 'FEE_INVOICE_VIEW', name: 'View Invoices', module: 'fees', category: 'fees' },
  { code: 'FEE_INVOICE_CREATE', name: 'Create Invoice', module: 'fees', category: 'fees' },
  { code: 'FEE_PAYMENT_RECORD', name: 'Record Payment', module: 'fees', category: 'fees' },
  { code: 'FEE_DISCOUNT_MANAGE', name: 'Manage Discounts', module: 'fees', category: 'fees' },

  // Finance
  { code: 'FINANCE_VIEW', name: 'View Finance', module: 'finance', category: 'finance' },
  { code: 'FINANCE_MANAGE', name: 'Manage Finance', module: 'finance', category: 'finance' },
  { code: 'FINANCE_REPORT', name: 'Finance Reports', module: 'finance', category: 'finance' },

  // HRMS
  { code: 'EMPLOYEE_VIEW', name: 'View Employees', module: 'hrms', category: 'hrms' },
  { code: 'EMPLOYEE_MANAGE', name: 'Manage Employees', module: 'hrms', category: 'hrms' },
  { code: 'PAYROLL_MANAGE', name: 'Manage Payroll', module: 'hrms', category: 'hrms' },

  // Library
  { code: 'LIBRARY_VIEW', name: 'View Library', module: 'library', category: 'library' },
  { code: 'LIBRARY_MANAGE', name: 'Manage Library', module: 'library', category: 'library' },

  // Transport
  { code: 'TRANSPORT_VIEW', name: 'View Transport', module: 'transport', category: 'transport' },
  { code: 'TRANSPORT_MANAGE', name: 'Manage Transport', module: 'transport', category: 'transport' },

  // Hostel
  { code: 'HOSTEL_VIEW', name: 'View Hostel', module: 'hostel', category: 'hostel' },
  { code: 'HOSTEL_MANAGE', name: 'Manage Hostel', module: 'hostel', category: 'hostel' },

  // Documents
  { code: 'DOCUMENTS_VIEW', name: 'View Documents', module: 'documents', category: 'documents' },
  { code: 'DOCUMENTS_GENERATE', name: 'Generate Documents', module: 'documents', category: 'documents' },
  { code: 'DOCUMENTS_PRINT', name: 'Print Documents', module: 'documents', category: 'documents' },
  { code: 'DOCUMENTS_VOID', name: 'Void Documents', module: 'documents', category: 'documents' },
  { code: 'DOCUMENTS_TEMPLATE_MANAGE', name: 'Manage Templates', module: 'documents', category: 'documents' },

  // Inventory
  { code: 'INVENTORY_VIEW', name: 'View Inventory', module: 'inventory', category: 'inventory' },
  { code: 'INVENTORY_MANAGE', name: 'Manage Inventory', module: 'inventory', category: 'inventory' },

  // Communication
  { code: 'NOTICE_VIEW', name: 'View Notices', module: 'communication', category: 'communication' },
  { code: 'NOTICE_CREATE', name: 'Create Notice', module: 'communication', category: 'communication' },
  { code: 'NOTICE_MANAGE', name: 'Manage Notices', module: 'communication', category: 'communication' },
  { code: 'SMS_SEND', name: 'Send SMS', module: 'communication', category: 'communication' },
  { code: 'EMAIL_SEND', name: 'Send Email', module: 'communication', category: 'communication' },

  // Reports
  { code: 'REPORT_VIEW', name: 'View Reports', module: 'reports', category: 'reports' },
  { code: 'REPORT_EXPORT', name: 'Export Reports', module: 'reports', category: 'reports' },
  { code: 'REPORT_PRINT', name: 'Print Reports', module: 'reports', category: 'reports' },

  // Settings
  { code: 'SETTINGS_VIEW', name: 'View Settings', module: 'settings', category: 'settings' },
  { code: 'SETTINGS_MANAGE', name: 'Manage Settings', module: 'settings', category: 'settings' },
  { code: 'ROLE_MANAGE', name: 'Manage Roles', module: 'settings', category: 'settings' },
  { code: 'USER_MANAGE', name: 'Manage Users', module: 'settings', category: 'settings' },
  { code: 'AUDIT_LOG_VIEW', name: 'View Audit Logs', module: 'settings', category: 'settings' },

  // System
  { code: '*', name: 'Super Admin All Access', module: 'system', category: 'system', isSystem: true }
];

const roleDefinitions = [
  {
    name: 'Super Admin',
    slug: 'super_admin',
    isSystem: true,
    permissionCodes: ['*']
  },
  {
    name: 'School Admin',
    slug: 'school_admin',
    isDefault: true,
    permissionCodes: [
      'DASHBOARD_VIEW', 'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_UPDATE', 'STUDENT_DELETE',
      'STUDENT_BULK_IMPORT', 'STUDENT_BULK_EXPORT', 'STUDENT_PROMOTE',
      'TEACHER_VIEW', 'TEACHER_CREATE', 'TEACHER_UPDATE', 'TEACHER_DELETE',
      'CLASS_VIEW', 'CLASS_MANAGE', 'SUBJECT_VIEW', 'SUBJECT_MANAGE',
      'TIMETABLE_VIEW', 'TIMETABLE_MANAGE', 'ATTENDANCE_VIEW', 'ATTENDANCE_MARK', 'ATTENDANCE_REPORT',
      'FEE_STRUCTURE_VIEW', 'FEE_STRUCTURE_MANAGE', 'FEE_INVOICE_VIEW', 'FEE_INVOICE_CREATE',
      'FEE_PAYMENT_RECORD', 'FEE_DISCOUNT_MANAGE', 'FINANCE_VIEW', 'FINANCE_MANAGE', 'FINANCE_REPORT',
      'EMPLOYEE_VIEW', 'EMPLOYEE_MANAGE', 'PAYROLL_MANAGE', 'LIBRARY_VIEW', 'LIBRARY_MANAGE',
      'TRANSPORT_VIEW', 'TRANSPORT_MANAGE', 'HOSTEL_VIEW', 'HOSTEL_MANAGE',
      'DOCUMENTS_VIEW', 'DOCUMENTS_GENERATE', 'DOCUMENTS_PRINT', 'DOCUMENTS_VOID', 'DOCUMENTS_TEMPLATE_MANAGE',
      'INVENTORY_VIEW', 'INVENTORY_MANAGE',
      'NOTICE_VIEW', 'NOTICE_CREATE', 'NOTICE_MANAGE', 'SMS_SEND', 'EMAIL_SEND',
      'REPORT_VIEW', 'REPORT_EXPORT', 'REPORT_PRINT',
      'SETTINGS_VIEW', 'SETTINGS_MANAGE', 'ROLE_MANAGE', 'USER_MANAGE', 'AUDIT_LOG_VIEW'
    ]
  },
  {
    name: 'Teacher',
    slug: 'teacher',
    isDefault: true,
    permissionCodes: [
      'DASHBOARD_VIEW', 'STUDENT_VIEW', 'STUDENT_UPDATE',
      'CLASS_VIEW', 'SUBJECT_VIEW', 'TIMETABLE_VIEW',
      'ATTENDANCE_VIEW', 'ATTENDANCE_MARK', 'ATTENDANCE_REPORT',
      'NOTICE_VIEW', 'REPORT_VIEW', 'DOCUMENTS_VIEW', 'DOCUMENTS_GENERATE'
    ]
  },
  {
    name: 'Accountant',
    slug: 'accountant',
    isDefault: true,
    permissionCodes: [
      'DASHBOARD_VIEW', 'STUDENT_VIEW', 'TEACHER_VIEW',
      'FEE_STRUCTURE_VIEW', 'FEE_STRUCTURE_MANAGE', 'FEE_INVOICE_VIEW', 'FEE_INVOICE_CREATE',
      'FEE_PAYMENT_RECORD', 'FEE_DISCOUNT_MANAGE', 'FINANCE_VIEW', 'FINANCE_MANAGE',
      'REPORT_VIEW', 'REPORT_EXPORT'
    ]
  },
  {
    name: 'Receptionist',
    slug: 'receptionist',
    isDefault: true,
    permissionCodes: [
      'DASHBOARD_VIEW', 'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_UPDATE',
      'TEACHER_VIEW', 'ATTENDANCE_VIEW', 'NOTICE_VIEW'
    ]
  },
  {
    name: 'Student',
    slug: 'student',
    isDefault: true,
    permissionCodes: ['DASHBOARD_VIEW', 'STUDENT_VIEW', 'TIMETABLE_VIEW', 'NOTICE_VIEW']
  },
  {
    name: 'Parent',
    slug: 'parent',
    isDefault: true,
    permissionCodes: ['DASHBOARD_VIEW', 'STUDENT_VIEW', 'TIMETABLE_VIEW', 'NOTICE_VIEW', 'ATTENDANCE_VIEW']
  }
];

const seedRbac = async () => {
  try {
    console.log('Seeding permissions...');
    for (const perm of defaultPermissions) {
      await Permission.findOneAndUpdate(
        { code: perm.code },
        { ...perm, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log(`${defaultPermissions.length} permissions ensured.`);

    const allPermissions = await Permission.find({ isActive: true });
    const codeToId = new Map(allPermissions.map(p => [p.code, p._id]));

    console.log('Seeding roles...');
    for (const role of roleDefinitions) {
      const permissionIds = role.permissionCodes
        .map(code => codeToId.get(code))
        .filter(Boolean);

      await Role.findOneAndUpdate(
        { slug: role.slug, tenantId: { $exists: false } },
        {
          ...role,
          permissionCodes: role.permissionCodes,
          permissions: permissionIds,
          isActive: true
        },
        { upsert: true, new: true }
      );
    }
    console.log(`${roleDefinitions.length} system roles ensured.`);

    process.exit(0);
  } catch (error) {
    console.error('RBAC seed error:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => seedRbac());
