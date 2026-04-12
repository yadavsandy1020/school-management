require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const School = require('../models/School');
const User = require('../models/User');
const Class = require('../models/Class');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data (optional - comment out if you want to preserve data)
    // await User.deleteMany({});
    // await School.deleteMany({});
    // await Class.deleteMany({});

    // Check if super admin exists
    const superAdminExists = await User.findOne({ role: 'super_admin' });
    
    if (!superAdminExists) {
      console.log('Creating Super Admin...');
      const superAdmin = await User.create({
        name: 'Super Admin',
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@schoolsaas.com',
        password: process.env.SUPER_ADMIN_PASSWORD || 'admin123456',
        role: 'super_admin'
      });
      console.log('Super Admin created:', superAdmin.email);
    } else {
      console.log('Super Admin already exists');
    }

    // Create demo school
    const demoSchoolExists = await School.findOne({ name: 'Demo School' });
    
    if (!demoSchoolExists) {
      console.log('Creating Demo School...');
      const demoSchool = await School.create({
        tenantId: 'demo-school-123456',
        name: 'Demo School',
        subdomain: 'demoschool',
        address: {
          street: '123 Main Street',
          city: 'Shikohabad',
          state: 'Uttar Pradesh',
          pincode: '283203',
          country: 'India'
        },
        contact: {
          phone: '+91-9876543210',
          email: 'info@demoschool.com',
          website: 'www.demoschool.com'
        },
        academicConfig: {
          currentSession: '2024-25',
          sessionStartMonth: 'April'
        },
        subscription: {
          plan: 'premium',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true
        },
        enabledModules: {
          students: true,
          teachers: true,
          attendance: true,
          fees: true,
          notices: true,
          reports: true,
          admissions: true,
          timetable: true,
          exams: false,
          library: false,
          transport: false,
          hostel: false
        }
      });

      console.log('Demo School created:', demoSchool.tenantId);

      // Create school admin
      const schoolAdmin = await User.create({
        name: 'School Admin',
        email: 'schooladmin@demoschool.com',
        password: 'admin123',
        role: 'school_admin',
        tenantId: demoSchool.tenantId,
        schoolId: demoSchool._id
      });
      console.log('School Admin created:', schoolAdmin.email);

      // Create demo classes
      const classes = [
        { name: 'Class 1', sections: ['A', 'B'] },
        { name: 'Class 2', sections: ['A', 'B'] },
        { name: 'Class 3', sections: ['A', 'B'] },
        { name: 'Class 4', sections: ['A'] },
        { name: 'Class 5', sections: ['A'] }
      ];

      for (const classData of classes) {
        const newClass = await Class.create({
          name: classData.name,
          sections: classData.sections,
          tenantId: demoSchool.tenantId,
          schoolId: demoSchool._id,
          capacity: 40
        });
        console.log(`Created ${classData.name} with sections: ${classData.sections.join(', ')}`);
      }

      // Create demo teacher
      const teacher = await User.create({
        name: 'Demo Teacher',
        email: 'teacher@demoschool.com',
        password: 'teacher123',
        role: 'teacher',
        tenantId: demoSchool.tenantId,
        schoolId: demoSchool._id,
        phone: '+91-9876543211'
      });
      console.log('Demo Teacher created:', teacher.email);

      // Create demo student
      const Student = require('../models/Student');
      const class1 = await Class.findOne({ name: 'Class 1', schoolId: demoSchool._id });
      
      const student = await Student.create({
        admissionNo: 'STD-2024-001',
        tenantId: demoSchool.tenantId,
        schoolId: demoSchool._id,
        classId: class1._id,
        section: 'A',
        academicSession: '2024-25',
        personalInfo: {
          firstName: 'Rahul',
          lastName: 'Sharma',
          dateOfBirth: new Date('2015-05-15'),
          gender: 'male'
        },
        contactInfo: {
          phone: '+91-9876543212',
          address: {
            street: '456 Colony',
            city: 'Shikohabad',
            state: 'Uttar Pradesh',
            pincode: '283203'
          }
        },
        parentInfo: {
          fatherName: 'Rajesh Sharma',
          fatherPhone: '+91-9876543213',
          fatherOccupation: 'Business'
        }
      });
      console.log('Demo Student created:', student.admissionNo);

      console.log('\n=== Demo Data Created Successfully ===');
      console.log('Super Admin Login:');
      console.log('  Email:', process.env.SUPER_ADMIN_EMAIL || 'admin@schoolsaas.com');
      console.log('  Password:', process.env.SUPER_ADMIN_PASSWORD || 'admin123456');
      console.log('\nSchool Admin Login:');
      console.log('  Email: schooladmin@demoschool.com');
      console.log('  Password: admin123');
      console.log('  Tenant ID:', demoSchool.tenantId);
      console.log('\nTeacher Login:');
      console.log('  Email: teacher@demoschool.com');
      console.log('  Password: teacher123');
      console.log('  Tenant ID:', demoSchool.tenantId);
      
    } else {
      console.log('Demo School already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
};

connectDB().then(() => {
  seedData();
});
