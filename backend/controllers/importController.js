const { parse } = require('csv-parse');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const { getNextNumber } = require('../services/sequenceService');

const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    parse(buffer, { columns: true, trim: true, skip_empty_lines: true }, (err, records) => {
      if (err) reject(err);
      else resolve(records);
    });
  });
};

exports.bulkImportStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const records = await parseCSV(req.file.buffer);
    if (!records.length) {
      return res.status(400).json({ success: false, error: 'CSV file is empty' });
    }

    const results = [];
    const errors = [];

    // Pre-fetch classes for this tenant
    const classes = await Class.find({ tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true });
    const classMap = new Map();
    classes.forEach(c => {
      classMap.set(c.name.toLowerCase(), c);
      if (c.sections) {
        c.sections.forEach(s => {
          classMap.set(`${c.name.toLowerCase()}-${s.toLowerCase()}`, { ...c.toObject(), section: s });
        });
      }
    });

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        const className = (row.class || row.Class || '').trim();
        const section = (row.section || row.Section || '').trim();
        const classKey = section ? `${className.toLowerCase()}-${section.toLowerCase()}` : className.toLowerCase();
        const classData = classMap.get(classKey) || classMap.get(className.toLowerCase());

        if (!classData) {
          errors.push({ row: rowNum, admissionNo: row.admissionNo || row.admissionNo, error: `Class '${className}' not found` });
          continue;
        }

        const firstName = (row.firstName || row.FirstName || row.first_name || '').trim();
        const lastName = (row.lastName || row.LastName || row.last_name || '').trim();
        const dateOfBirth = (row.dateOfBirth || row.DateOfBirth || row.dob || row.DOB || '').trim();
        const gender = (row.gender || row.Gender || '').trim().toLowerCase();
        const rollNo = (row.rollNo || row.RollNo || row.roll_no || '').trim();
        const fatherName = (row.fatherName || row.FatherName || row.father_name || '').trim();
        const motherName = (row.motherName || row.MotherName || row.mother_name || '').trim();
        const fatherPhone = (row.fatherPhone || row.FatherPhone || row.father_phone || row.phone || '').trim();
        const fatherEmail = (row.fatherEmail || row.FatherEmail || row.father_email || row.email || '').trim();
        const address = (row.address || row.Address || '').trim();

        if (!firstName) {
          errors.push({ row: rowNum, error: 'First name is required' });
          continue;
        }

        const admissionNo = (row.admissionNo || row.AdmissionNo || row.admission_no || '').trim() ||
          await getNextNumber({
            tenantId: req.user.tenantId,
            schoolId: req.user.schoolId,
            entityType: 'student',
            academicSession: row.academicSession || new Date().getFullYear().toString()
          });

        const existing = await Student.findOne({ admissionNo, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
        if (existing) {
          errors.push({ row: rowNum, admissionNo, error: 'Admission number already exists' });
          continue;
        }

        const personalInfo = {
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender: ['male', 'female', 'other'].includes(gender) ? gender : undefined
        };

        const parentInfo = {
          fatherName,
          motherName,
          fatherPhone,
          fatherEmail
        };

        const contactInfo = {
          phone: fatherPhone,
          email: fatherEmail,
          address: address ? { street: address } : undefined
        };

        const student = await Student.create({
          admissionNo,
          rollNo,
          tenantId: req.user.tenantId,
          schoolId: req.user.schoolId,
          classId: classData._id,
          section: section || classData.section,
          academicSession: row.academicSession || new Date().getFullYear().toString(),
          personalInfo,
          parentInfo,
          contactInfo
        });

        results.push({ row: rowNum, admissionNo, name: `${firstName} ${lastName}` });
      } catch (err) {
        errors.push({ row: rowNum, error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      imported: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.bulkImportTeachers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const records = await parseCSV(req.file.buffer);
    if (!records.length) {
      return res.status(400).json({ success: false, error: 'CSV file is empty' });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNum = i + 2;

      try {
        const firstName = (row.firstName || row.FirstName || row.first_name || '').trim();
        const lastName = (row.lastName || row.LastName || row.last_name || '').trim();
        const email = (row.email || row.Email || '').trim();
        const phone = (row.phone || row.Phone || '').trim();
        const designation = (row.designation || row.Designation || '').trim();
        const employeeId = (row.employeeId || row.EmployeeId || row.employee_id || '').trim();
        const joinDate = (row.joinDate || row.JoinDate || row.join_date || '').trim();
        const qualification = (row.qualification || row.Qualification || '').trim();
        const gender = (row.gender || row.Gender || '').trim().toLowerCase();
        const subjects = (row.subjects || row.Subjects || '').trim();

        if (!firstName) {
          errors.push({ row: rowNum, error: 'First name is required' });
          continue;
        }
        if (!email) {
          errors.push({ row: rowNum, error: 'Email is required' });
          continue;
        }

        const existing = await Teacher.findOne({ 'contactInfo.email': email, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
        if (existing) {
          errors.push({ row: rowNum, email, error: 'Teacher with this email already exists' });
          continue;
        }

        const finalEmployeeId = employeeId || await getNextNumber({
          tenantId: req.user.tenantId,
          schoolId: req.user.schoolId,
          entityType: 'teacher'
        });

        const teacher = await Teacher.create({
          employeeId: finalEmployeeId,
          tenantId: req.user.tenantId,
          schoolId: req.user.schoolId,
          personalInfo: {
            firstName,
            lastName,
            gender: ['male', 'female', 'other'].includes(gender) ? gender : undefined
          },
          contactInfo: {
            email,
            phone
          },
          employmentDetails: {
            designation: designation || 'Teacher',
            joinDate: joinDate ? new Date(joinDate) : new Date(),
            qualification,
            subjects: subjects ? subjects.split(',').map(s => s.trim()) : []
          },
          salaryDetails: {
            basicSalary: Number(row.basicSalary || row.BasicSalary || 0),
            totalSalary: Number(row.totalSalary || row.TotalSalary || row.basicSalary || 0)
          }
        });

        results.push({ row: rowNum, employeeId: finalEmployeeId, name: `${firstName} ${lastName}` });
      } catch (err) {
        errors.push({ row: rowNum, error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      imported: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.downloadStudentTemplate = (req, res) => {
  const headers = ['admissionNo', 'rollNo', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'class', 'section', 'fatherName', 'motherName', 'fatherPhone', 'fatherEmail', 'address', 'academicSession'];
  const csv = headers.join(',') + '\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student-import-template.csv"');
  res.send(csv);
};

exports.downloadTeacherTemplate = (req, res) => {
  const headers = ['employeeId', 'firstName', 'lastName', 'email', 'phone', 'designation', 'gender', 'joinDate', 'qualification', 'subjects', 'basicSalary', 'totalSalary'];
  const csv = headers.join(',') + '\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="teacher-import-template.csv"');
  res.send(csv);
};
