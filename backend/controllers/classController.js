const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const FeeStructure = require('../models/FeeStructure');
const AcademicSession = require('../models/AcademicSession');
const { buildPaginationResponse } = require('../middleware/pagination');

// @desc    Create class
// @route   POST /api/classes
// @access  Private (School Admin)
exports.createClass = async (req, res) => {
  try {
    const { name, sections, classTeacher, subjects, roomNumber, capacity, fees, installments } = req.body;

    const classData = await Class.create({
      name,
      sections,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      classTeacher,
      subjects,
      roomNumber,
      capacity
    });

    // Create fee structure if fee items are provided
    if (Array.isArray(fees) && fees.length > 0) {
      const totalAmount = fees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);

      // Determine current academic session
      let academicSession = new Date().getFullYear().toString();
      const currentSession = await AcademicSession.findOne({
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        isCurrent: true
      });
      if (currentSession) {
        academicSession = currentSession.name;
      }

      const feeStructure = await FeeStructure.create({
        name: `${name} Fee Structure`,
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        classId: classData._id,
        academicSession,
        fees,
        installments: installments && installments.length > 0 ? installments : undefined,
        totalAmount
      });

      classData.feeStructure = feeStructure._id;
      await classData.save();
    }

    res.status(201).json({
      success: true,
      class: classData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
exports.getClasses = async (req, res) => {
  try {
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true };

    const { page, limit, skip } = req.pagination;
    const total = await Class.countDocuments(filter);
    const classes = await Class.find(filter)
      .populate('classTeacher', 'name email')
      .populate('subjects', 'name code')
      .populate('feeStructure', 'name totalAmount')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(buildPaginationResponse(classes, total, page, limit));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private
exports.getClass = async (req, res) => {
  try {
    const classData = await Class.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId })
      .populate('classTeacher', 'name email phone')
      .populate('subjects', 'name code')
      .populate('feeStructure', 'name fees totalAmount');

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Check tenant access
    if (classData.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this class'
      });
    }

    // Get student count per section
    const studentCounts = {};
    for (const section of classData.sections) {
      const count = await Student.countDocuments({
        classId: classData._id,
        section,
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        isActive: true
      });
      studentCounts[section] = count;
    }

    res.status(200).json({
      success: true,
      class: { ...classData.toObject(), studentCounts }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private (School Admin)
exports.updateClass = async (req, res) => {
  try {
    let classData = await Class.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Check tenant access
    if (classData.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this class'
      });
    }

    const { name, sections, classTeacher, subjects, roomNumber, capacity, fees, installments } = req.body;

    classData = await Class.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
      { name, sections, classTeacher, subjects, roomNumber, capacity },
      { new: true, runValidators: true }
    ).populate('classTeacher', 'name').populate('subjects', 'name code');

    // Update or create fee structure if fees are provided
    if (Array.isArray(fees) && fees.length > 0) {
      const totalAmount = fees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);

      let academicSession = new Date().getFullYear().toString();
      const currentSession = await AcademicSession.findOne({
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        isCurrent: true
      });
      if (currentSession) {
        academicSession = currentSession.name;
      }

      if (classData.feeStructure) {
        await FeeStructure.findOneAndUpdate(
          { _id: classData.feeStructure },
          { fees, installments: installments && installments.length > 0 ? installments : undefined, totalAmount },
          { new: true }
        );
      } else {
        const feeStructure = await FeeStructure.create({
          name: `${name} Fee Structure`,
          tenantId: req.user.tenantId,
          schoolId: req.user.schoolId,
          classId: classData._id,
          academicSession,
          fees,
          installments: installments && installments.length > 0 ? installments : undefined,
          totalAmount
        });
        classData.feeStructure = feeStructure._id;
        await classData.save();
      }
    }

    res.status(200).json({
      success: true,
      class: classData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (School Admin)
exports.deleteClass = async (req, res) => {
  try {
    const classData = await Class.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    // Check tenant access
    if (classData.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this class'
      });
    }

    // Check if class has students
    const studentCount = await Student.countDocuments({ classId: classData._id, tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete class with active students'
      });
    }

    await classData.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add section to class
// @route   POST /api/classes/:id/sections
// @access  Private (School Admin)
exports.addSection = async (req, res) => {
  try {
    const classData = await Class.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.tenantId !== req.user.tenantId || classData.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this class' });
    }

    const { section } = req.body;
    if (!section || !section.trim()) {
      return res.status(400).json({ success: false, error: 'Section is required' });
    }

    if (classData.sections.includes(section)) {
      return res.status(400).json({
        success: false,
        error: 'Section already exists'
      });
    }

    classData.sections.push(section);
    await classData.save();

    res.status(200).json({
      success: true,
      class: classData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Remove section from class
// @route   DELETE /api/classes/:id/sections/:section
// @access  Private (School Admin)
exports.removeSection = async (req, res) => {
  try {
    const classData = await Class.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.tenantId !== req.user.tenantId || classData.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this class' });
    }

    // Check if section has students
    const studentCount = await Student.countDocuments({
      classId: classData._id,
      section: req.params.section,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      isActive: true
    });

    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove section with active students'
      });
    }

    classData.sections = classData.sections.filter(s => s !== req.params.section);
    await classData.save();

    res.status(200).json({
      success: true,
      class: classData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Assign subjects to class
// @route   PUT /api/classes/:id/subjects
// @access  Private (School Admin)
exports.assignSubjects = async (req, res) => {
  try {
    const classData = await Class.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!classData) {
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }

    if (classData.tenantId !== req.user.tenantId || classData.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this class' });
    }

    const { subjects } = req.body;
    if (!Array.isArray(subjects)) {
      return res.status(400).json({ success: false, error: 'Subjects must be an array' });
    }
    classData.subjects = subjects;
    await classData.save();

    // Update subjects to include this class
    await Subject.updateMany(
      { _id: { $in: subjects }, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
      { $addToSet: { classes: classData._id } }
    );

    const updatedClass = await Class.findOne({ _id: classData._id, tenantId: req.user.tenantId, schoolId: req.user.schoolId }).populate('subjects', 'name code');

    res.status(200).json({
      success: true,
      class: updatedClass
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
