const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
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

const getOrCreateSystemRole = async (slug, name, permissionCodes) => {
  let role = await Role.findOne({ slug, tenantId: { $exists: false } });
  if (!role) {
    role = await Role.create({ name, slug, isSystem: true, permissionCodes, isActive: true });
    console.log(`Created system role: ${name}`);
  }
  return role;
};

const seedData = async () => {
  try {
    // Ensure system roles exist
    const superAdminRole = await getOrCreateSystemRole('super_admin', 'Super Admin', ['*']);
    await getOrCreateSystemRole('school_admin', 'School Admin', [
      'DASHBOARD_VIEW', 'STUDENT_VIEW', 'STUDENT_CREATE', 'STUDENT_UPDATE', 'STUDENT_DELETE',
      'TEACHER_VIEW', 'TEACHER_CREATE', 'TEACHER_UPDATE', 'TEACHER_DELETE',
      'CLASS_VIEW', 'CLASS_MANAGE', 'ATTENDANCE_VIEW', 'ATTENDANCE_MARK', 'ATTENDANCE_REPORT',
      'FEE_STRUCTURE_VIEW', 'FEE_STRUCTURE_MANAGE', 'FEE_INVOICE_VIEW', 'FEE_INVOICE_CREATE',
      'FEE_PAYMENT_RECORD', 'FINANCE_VIEW', 'FINANCE_MANAGE', 'LIBRARY_VIEW', 'LIBRARY_MANAGE',
      'TRANSPORT_VIEW', 'TRANSPORT_MANAGE', 'HOSTEL_VIEW', 'HOSTEL_MANAGE',
      'EMPLOYEE_VIEW', 'EMPLOYEE_MANAGE', 'PAYROLL_MANAGE',
      'INVENTORY_VIEW', 'INVENTORY_MANAGE',
      'NOTICE_VIEW', 'NOTICE_CREATE', 'NOTICE_MANAGE', 'REPORT_VIEW', 'REPORT_EXPORT',
      'SETTINGS_VIEW', 'SETTINGS_MANAGE', 'ROLE_MANAGE', 'USER_MANAGE', 'AUDIT_LOG_VIEW'
    ]);
    await getOrCreateSystemRole('teacher', 'Teacher', [
      'DASHBOARD_VIEW', 'STUDENT_VIEW', 'CLASS_VIEW', 'ATTENDANCE_VIEW', 'ATTENDANCE_MARK',
      'ATTENDANCE_REPORT', 'NOTICE_VIEW'
    ]);
    await getOrCreateSystemRole('student', 'Student', [
      'DASHBOARD_VIEW', 'CLASS_VIEW', 'ATTENDANCE_VIEW', 'NOTICE_VIEW'
    ]);
    await getOrCreateSystemRole('parent', 'Parent', [
      'DASHBOARD_VIEW', 'STUDENT_VIEW', 'ATTENDANCE_VIEW', 'FEE_INVOICE_VIEW', 'NOTICE_VIEW'
    ]);

    // Create super admin if not exists
    const superAdminExists = await User.findOne({ role: 'super_admin' });

    if (!superAdminExists) {
      console.log('Creating Super Admin...');
      const superAdmin = await User.create({
        name: 'Super Admin',
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@schoolsaas.com',
        password: process.env.SUPER_ADMIN_PASSWORD || 'admin123456',
        role: 'super_admin',
        roleId: superAdminRole._id
      });
      console.log('Super Admin created:', superAdmin.email);
    } else {
      console.log('Super Admin already exists');
    }

    console.log('\n=== Seed Complete ===');
    console.log('Super Admin Login:');
    console.log('  Email:', process.env.SUPER_ADMIN_EMAIL || 'admin@schoolsaas.com');
    console.log('  Password:', process.env.SUPER_ADMIN_PASSWORD || 'admin123456');
    console.log('\nUse the onboarding flow to create schools.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => {
  seedData();
});
