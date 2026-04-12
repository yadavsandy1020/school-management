const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const { buildPaginationResponse } = require('../middleware/pagination');

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

    // Check if employee ID already exists
    const existingTeacher = await Teacher.findOne({ employeeId });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID already exists'
      });
    }

    // Create teacher
    const teacher = await Teacher.create({
      employeeId,
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
      .limit(limit);

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
    const teacher = await Teacher.findById(req.params.id)
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

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (School Admin)
exports.updateTeacher = async (req, res) => {
  try {
    let teacher = await Teacher.findById(req.params.id);

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

    teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
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
    const teacher = await Teacher.findById(req.params.id);

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
      { classTeacher: teacher._id },
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
    const teacher = await Teacher.findById(req.params.id);

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
      { _id: { $in: subjects } },
      { $addToSet: { teachers: teacher._id } }
    );

    const updatedTeacher = await Teacher.findById(teacher._id).populate('subjects', 'name code');

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
    const teacher = await Teacher.findById(req.params.id);

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
        await Class.findByIdAndUpdate(
          classAssignment.classId,
          { classTeacher: teacher._id }
        );
      }
    }

    const updatedTeacher = await Teacher.findById(teacher._id).populate('classes.classId', 'name');

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
    const teacher = await Teacher.findById(req.params.id);

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

    teacher.salaryDetails = req.body.salaryDetails;
    
    // Calculate total salary
    const { basicSalary, allowances } = teacher.salaryDetails;
    const totalAllowances = (allowances?.da || 0) + (allowances?.hra || 0) + 
                           (allowances?.ta || 0) + (allowances?.others || 0);
    teacher.salaryDetails.totalSalary = basicSalary + totalAllowances;
    
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
