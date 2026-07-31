const Teacher = require('../models/Teacher');
const TeacherSalaryPayment = require('../models/TeacherSalaryPayment');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const { buildPaginationResponse } = require('../middleware/pagination');
const { getNextNumber } = require('../services/sequenceService');

const computeTotalSalary = (salaryDetails) => {
  if (!salaryDetails) return 0;
  const basic = salaryDetails.basicSalary || 0;
  const allowances = salaryDetails.allowances || {};
  const totalAllowances = (allowances.da || 0) + (allowances.hra || 0) +
    (allowances.ta || 0) + (allowances.others || 0);
  return basic + totalAllowances;
};

// @desc    Create teacher
// @route   POST /api/teachers
// @access  Private (School Admin)
exports.createTeacher = async (req, res) => {
  try {
    const {
      employeeId,
      personalInfo,
      contactInfo,
      employmentDetails,
      subjects,
      classes,
      salaryDetails,
      photo,
      documents,
      customFields
    } = req.body;

    if (contactInfo && typeof contactInfo.address === 'string') {
      contactInfo.address = { street: contactInfo.address };
    }

    const finalEmployeeId = employeeId && employeeId.trim()
      ? employeeId.trim()
      : await getNextNumber({
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        entityType: 'teacher',
        academicSession: employmentDetails?.academicSession || new Date().getFullYear().toString()
      });

    // Check if employee ID already exists
    const existingTeacher = await Teacher.findOne({ employeeId: finalEmployeeId, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID already exists'
      });
    }

    if (salaryDetails) {
      salaryDetails.totalSalary = computeTotalSalary(salaryDetails);
    }

    // Create teacher
    const teacher = await Teacher.create({
      employeeId: finalEmployeeId,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      personalInfo,
      contactInfo,
      employmentDetails,
      subjects,
      classes,
      salaryDetails,
      photo,
      documents,
      customFields
    });

    res.status(201).json({
      success: true,
      teacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
exports.getTeachers = async (req, res) => {
  try {
    const { department, search } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true };

    if (department) filter['employmentDetails.department'] = department;

    // Search functionality
    if (search) {
      filter.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    const { page, limit, skip } = req.pagination;
    const total = await Teacher.countDocuments(filter);
    const teachers = await Teacher.find(filter)
      .populate('subjects', 'name code')
      .populate('classes.classId', 'name')
      .sort({ 'personalInfo.firstName': 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach salary stats
    const teacherIds = teachers.map((t) => t._id);
    const paymentSums = await TeacherSalaryPayment.aggregate([
      { $match: { teacherId: { $in: teacherIds }, tenantId: req.user.tenantId, schoolId: req.user.schoolId } },
      { $group: { _id: '$teacherId', paid: { $sum: '$amount' } } }
    ]);
    const paidMap = new Map(paymentSums.map((p) => [p._id.toString(), p.paid]));

    teachers.forEach((t) => {
      const totalSalary = t.salaryDetails?.totalSalary || 0;
      const paid = paidMap.get(t._id.toString()) || 0;
      t.salaryStats = {
        total: totalSalary,
        paid,
        outstanding: totalSalary - paid
      };
    });

    res.status(200).json(buildPaginationResponse(teachers, total, page, limit));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private
exports.getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId })
      .populate('subjects', 'name code')
      .populate('classes.classId', 'name sections')
      .populate('userId', 'name email');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    // Check tenant access
    if (teacher.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this teacher'
      });
    }

    const totalSalary = teacher.salaryDetails?.totalSalary || 0;
    const paymentSum = await TeacherSalaryPayment.aggregate([
      { $match: { teacherId: teacher._id, tenantId: req.user.tenantId, schoolId: req.user.schoolId } },
      { $group: { _id: null, paid: { $sum: '$amount' } } }
    ]);
    const paid = paymentSum[0]?.paid || 0;
    const recentPayments = await TeacherSalaryPayment.find({
      teacherId: teacher._id,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId
    })
      .sort({ paymentDate: -1 })
      .limit(10)
      .lean();

    const teacherObj = teacher.toObject();
    teacherObj.salaryStats = { total: totalSalary, paid, outstanding: totalSalary - paid };
    teacherObj.salaryPayments = recentPayments;

    res.status(200).json({
      success: true,
      teacher: teacherObj
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (School Admin)
exports.updateTeacher = async (req, res) => {
  try {
    let teacher = await Teacher.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    // Check tenant access
    if (teacher.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this teacher'
      });
    }

    const {
      personalInfo,
      contactInfo,
      employmentDetails,
      subjects,
      classes,
      salaryDetails,
      photo,
      documents,
      customFields
    } = req.body;

    if (contactInfo && typeof contactInfo.address === 'string') {
      contactInfo.address = { street: contactInfo.address };
    }

    if (salaryDetails) {
      salaryDetails.totalSalary = computeTotalSalary(salaryDetails);
    }

    teacher = await Teacher.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
      { personalInfo, contactInfo, employmentDetails, subjects, classes, salaryDetails, photo, documents, customFields },
      { new: true, runValidators: true }
    ).populate('subjects', 'name code');

    res.status(200).json({
      success: true,
      teacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (School Admin)
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    // Check tenant access
    if (teacher.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this teacher'
      });
    }

    // Remove as class teacher from classes
    await Class.updateMany(
      { classTeacher: teacher._id, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
      { $unset: { classTeacher: 1 } }
    );

    // Soft delete
    teacher.isActive = false;
    teacher.leavingDate = Date.now();
    await teacher.save();

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Assign subjects to teacher
// @route   PUT /api/teachers/:id/subjects
// @access  Private (School Admin)
exports.assignSubjects = async (req, res) => {
  try {
    const { subjects } = req.body;
    const teacher = await Teacher.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    // Check tenant access
    if (teacher.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this teacher'
      });
    }

    teacher.subjects = subjects;
    await teacher.save();

    // Update subject documents
    await Subject.updateMany(
      { _id: { $in: subjects }, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
      { $addToSet: { teachers: teacher._id } }
    );

    const updatedTeacher = await Teacher.findOne({ _id: teacher._id, tenantId: req.user.tenantId, schoolId: req.user.schoolId }).populate('subjects', 'name code');

    res.status(200).json({
      success: true,
      teacher: updatedTeacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Assign classes to teacher
// @route   PUT /api/teachers/:id/classes
// @access  Private (School Admin)
exports.assignClasses = async (req, res) => {
  try {
    const { classes } = req.body;
    const teacher = await Teacher.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    // Check tenant access
    if (teacher.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this teacher'
      });
    }

    teacher.classes = classes;
    await teacher.save();

    // Update class documents for class teachers
    for (const classAssignment of classes) {
      if (classAssignment.role === 'class_teacher' || classAssignment.role === 'both') {
        await Class.findOneAndUpdate(
          { _id: classAssignment.classId, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
          { classTeacher: teacher._id }
        );
      }
    }

    const updatedTeacher = await Teacher.findOne({ _id: teacher._id, tenantId: req.user.tenantId, schoolId: req.user.schoolId }).populate('classes.classId', 'name');

    res.status(200).json({
      success: true,
      teacher: updatedTeacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update teacher salary
// @route   PUT /api/teachers/:id/salary
// @access  Private (School Admin)
exports.updateSalary = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
    }

    // Check tenant access
    if (teacher.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this teacher'
      });
    }

    teacher.salaryDetails = req.body.salaryDetails || {};
    teacher.salaryDetails.totalSalary = computeTotalSalary(teacher.salaryDetails);

    await teacher.save();

    res.status(200).json({
      success: true,
      teacher
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
