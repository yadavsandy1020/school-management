const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const { buildPaginationResponse } = require('../middleware/pagination');
const { getNextNumber } = require('../services/sequenceService');
const licenseService = require('../services/licenseService');

// @desc    Create student
// @route   POST /api/students
// @access  Private (School Admin)
exports.createStudent = async (req, res) => {
  try {
    const {
      admissionNo,
      rollNo,
      classId,
      section,
      academicSession,
      personalInfo,
      contactInfo,
      parentInfo,
      photo,
      documents,
      customFields
    } = req.body;

    if (contactInfo && typeof contactInfo.address === 'string') {
      contactInfo.address = { street: contactInfo.address };
    }

    const finalAdmissionNo = admissionNo && admissionNo.trim()
      ? admissionNo.trim()
      : await getNextNumber({
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        entityType: 'student',
        academicSession: academicSession || new Date().getFullYear().toString()
      });

    // Check if admission number already exists
    const existingStudent = await Student.findOne({ admissionNo: finalAdmissionNo, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        error: 'Admission number already exists'
      });
    }

    // Validate class
    const classData = await Class.findOne({ _id: classId, tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true });
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // License student limit enforcement
    const limitCheck = await licenseService.checkStudentLimit(req.user.tenantId, req.user.schoolId, 1);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: limitCheck.reason,
        current: limitCheck.current,
        limit: limitCheck.limit,
        remaining: limitCheck.remaining
      });
    }

    // Create student
    const student = await Student.create({
      admissionNo: finalAdmissionNo,
      rollNo,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      classId,
      section,
      academicSession,
      personalInfo,
      contactInfo,
      parentInfo,
      photo,
      documents,
      customFields
    });

    // Update class strength
    classData.currentStrength += 1;
    await classData.save();

    res.status(201).json({
      success: true,
      student
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res) => {
  try {
    const { classId, section, academicSession, search } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true };

    if (classId) filter.classId = classId;
    if (section) filter.section = section;
    if (academicSession) filter.academicSession = academicSession;
    if (req.user.role === 'parent') filter._id = req.user.studentId;

    // Search functionality
    if (search) {
      filter.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { admissionNo: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } }
      ];
    }

    const { page, limit, skip } = req.pagination;
    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate('classId', 'name sections')
      .populate('parentId', 'name email phone')
      .sort({ admissionNo: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(buildPaginationResponse(students, total, page, limit));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId
    })
      .populate('classId', 'name sections')
      .populate('parentId', 'name email phone parentDetails');

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Check tenant access
    if (student.tenantId !== req.user.tenantId || (req.user.role === 'parent' && student._id.toString() !== req.user.studentId.toString())) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this student'
      });
    }

    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get logged in student's profile
// @route   GET /api/students/profile
// @access  Private (Student)
exports.getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      userId: req.user._id,
      isActive: true
    }).populate('classId', 'name sections');

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student profile not found' });
    }

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (School Admin)
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Check tenant access
    if (student.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this student'
      });
    }

    const {
      rollNo,
      classId,
      section,
      personalInfo,
      contactInfo,
      parentInfo,
      photo,
      documents,
      customFields
    } = req.body;

    if (contactInfo && typeof contactInfo.address === 'string') {
      contactInfo.address = { street: contactInfo.address };
    }

    // If class is changing, update old and new class strengths
    if (classId && classId !== student.classId.toString()) {
      const oldClass = await Class.findOne({ _id: student.classId, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
      const newClass = await Class.findOne({ _id: classId, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

      if (oldClass) {
        oldClass.currentStrength = Math.max(0, oldClass.currentStrength - 1);
        await oldClass.save();
      }

      if (newClass) {
        newClass.currentStrength += 1;
        await newClass.save();
      }
    }

    student = await Student.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
      { rollNo, classId, section, personalInfo, contactInfo, parentInfo, photo, documents, customFields },
      { new: true, runValidators: true }
    ).populate('classId', 'name sections');

    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (School Admin)
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Check tenant access
    if (student.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this student'
      });
    }

    // Update class strength
    const classData = await Class.findOne({ _id: student.classId, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (classData) {
      classData.currentStrength = Math.max(0, classData.currentStrength - 1);
      await classData.save();
    }

    // Soft delete
    student.isActive = false;
    student.isAlumni = true;
    student.leavingDate = Date.now();
    await student.save();

    // Reset linked admission so it can be re-enrolled
    const Admission = require('../models/Admission');
    await Admission.updateOne(
      { enrolledStudentId: student._id, status: 'enrolled' },
      { $set: { status: 'approved' } }
    );

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully. Linked admission reset to approved for re-enrollment.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Link parent to student
// @route   PUT /api/students/:id/link-parent
// @access  Private (School Admin)
exports.linkParent = async (req, res) => {
  try {
    const { parentId } = req.body;
    const student = await Student.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    const parent = await User.findOne({ _id: parentId, tenantId: req.user.tenantId, role: 'parent' });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    student.parentId = parentId;
    await student.save();

    // Add student to parent's children list
    if (!parent.parentDetails.children) {
      parent.parentDetails.children = [];
    }
    if (!parent.parentDetails.children.includes(student._id)) {
      parent.parentDetails.children.push(student._id);
      await parent.save();
    }

    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Bulk import students
// @route   POST /api/students/bulk
// @access  Private (School Admin)
exports.bulkImportStudents = async (req, res) => {
  try {
    const { students } = req.body;
    const results = [];
    const errors = [];

    const requestedCount = Array.isArray(students) ? students.length : 0;

    // License student limit enforcement
    const limitCheck = await licenseService.checkStudentLimit(req.user.tenantId, req.user.schoolId, requestedCount);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: limitCheck.reason,
        current: limitCheck.current,
        limit: limitCheck.limit,
        remaining: limitCheck.remaining
      });
    }

    for (const studentData of students) {
      try {
        const student = await Student.create({
          ...studentData,
          tenantId: req.user.tenantId,
          schoolId: req.user.schoolId
        });

        // Update class strength
        const classData = await Class.findOne({ _id: student.classId, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
        if (classData) {
          classData.currentStrength += 1;
          await classData.save();
        }

        results.push(student);
      } catch (error) {
        errors.push({
          data: studentData,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      imported: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getStudentByAdmissionNo = async (req, res) => {
  try {
    const student = await Student.findOne({
      admissionNo: req.params.admissionNo,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      isActive: true
    })
      .populate('classId', 'name sections')
      .populate('parentId', 'name email phone');

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
