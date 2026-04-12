const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const { buildPaginationResponse } = require('../middleware/pagination');

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

    // Check if admission number already exists
    const existingStudent = await Student.findOne({ admissionNo });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        error: 'Admission number already exists'
      });
    }

    // Validate class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Create student
    const student = await Student.create({
      admissionNo,
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
    const student = await Student.findById(req.params.id)
      .populate('classId', 'name sections')
      .populate('parentId', 'name email phone parentDetails');

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

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (School Admin)
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

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

    // If class is changing, update old and new class strengths
    if (classId && classId !== student.classId.toString()) {
      const oldClass = await Class.findById(student.classId);
      const newClass = await Class.findById(classId);

      if (oldClass) {
        oldClass.currentStrength = Math.max(0, oldClass.currentStrength - 1);
        await oldClass.save();
      }

      if (newClass) {
        newClass.currentStrength += 1;
        await newClass.save();
      }
    }

    student = await Student.findByIdAndUpdate(
      req.params.id,
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
    const student = await Student.findById(req.params.id);

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
    const classData = await Class.findById(student.classId);
    if (classData) {
      classData.currentStrength = Math.max(0, classData.currentStrength - 1);
      await classData.save();
    }

    // Soft delete
    student.isActive = false;
    student.isAlumni = true;
    student.leavingDate = Date.now();
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
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
    const student = await Student.findById(req.params.id);
    const parent = await User.findById(parentId);

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

    for (const studentData of students) {
      try {
        const student = await Student.create({
          ...studentData,
          tenantId: req.user.tenantId,
          schoolId: req.user.schoolId
        });

        // Update class strength
        const classData = await Class.findById(student.classId);
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
