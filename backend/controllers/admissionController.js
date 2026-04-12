const Admission = require('../models/Admission');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const { buildPaginationResponse } = require('../middleware/pagination');

// @desc    Create admission application
// @route   POST /api/admissions
// @access  Public
exports.createAdmission = async (req, res) => {
  try {
    const {
      classApplied,
      studentInfo,
      contactInfo,
      parentInfo,
      previousEducation,
      documents
    } = req.body;

    // Generate application number
    const applicationNo = 'ADM-' + Date.now().toString().slice(-8);
    const academicSession = new Date().getFullYear().toString();

    const admission = await Admission.create({
      applicationNo,
      tenantId: req.body.tenantId,
      schoolId: req.body.schoolId,
      academicSession,
      classApplied,
      studentInfo,
      contactInfo,
      parentInfo,
      previousEducation,
      documents
    });

    res.status(201).json({
      success: true,
      admission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all admissions
// @route   GET /api/admissions
// @access  Private
exports.getAdmissions = async (req, res) => {
  try {
    const { status, academicSession, classApplied } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId };

    if (status) filter.status = status;
    if (academicSession) filter.academicSession = academicSession;
    if (classApplied) filter.classApplied = classApplied;

    const { page, limit, skip } = req.pagination;
    const total = await Admission.countDocuments(filter);
    const admissions = await Admission.find(filter)
      .populate('classApplied', 'name')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(buildPaginationResponse(admissions, total, page, limit));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single admission
// @route   GET /api/admissions/:id
// @access  Private
exports.getAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate('classApplied', 'name sections')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('enrolledStudentId', 'admissionNo');

    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }

    // Check tenant access
    if (admission.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this admission'
      });
    }

    res.status(200).json({
      success: true,
      admission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update admission
// @route   PUT /api/admissions/:id
// @access  Private (School Admin)
exports.updateAdmission = async (req, res) => {
  try {
    let admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }

    // Check tenant access
    if (admission.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this admission'
      });
    }

    const { studentInfo, contactInfo, parentInfo, previousEducation, documents, remarks } = req.body;

    admission = await Admission.findByIdAndUpdate(
      req.params.id,
      { studentInfo, contactInfo, parentInfo, previousEducation, documents, remarks },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      admission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Review admission
// @route   PUT /api/admissions/:id/review
// @access  Private (School Admin)
exports.reviewAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }

    // Check tenant access
    if (admission.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to review this admission'
      });
    }

    admission.status = 'under_review';
    admission.reviewedBy = req.user.id;
    admission.reviewedDate = Date.now();
    admission.remarks = req.body.remarks;

    await admission.save();

    res.status(200).json({
      success: true,
      admission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Approve admission
// @route   PUT /api/admissions/:id/approve
// @access  Private (School Admin)
exports.approveAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }

    // Check tenant access
    if (admission.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to approve this admission'
      });
    }

    admission.status = 'approved';
    admission.approvedBy = req.user.id;
    admission.approvedDate = Date.now();

    await admission.save();

    res.status(200).json({
      success: true,
      admission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Reject admission
// @route   PUT /api/admissions/:id/reject
// @access  Private (School Admin)
exports.rejectAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }

    // Check tenant access
    if (admission.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to reject this admission'
      });
    }

    admission.status = 'rejected';
    admission.approvedBy = req.user.id;
    admission.approvedDate = Date.now();
    admission.remarks = req.body.remarks;

    await admission.save();

    res.status(200).json({
      success: true,
      admission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Enroll admission as student
// @route   POST /api/admissions/:id/enroll
// @access  Private (School Admin)
exports.enrollStudent = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }

    if (admission.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Admission must be approved before enrollment'
      });
    }

    // Check if already enrolled
    if (admission.enrolledStudentId) {
      return res.status(400).json({
        success: false,
        error: 'Student already enrolled'
      });
    }

    // Generate admission number
    const admissionNo = 'STD-' + Date.now().toString().slice(-8);
    const classData = await Class.findById(admission.classApplied);

    // Create student
    const student = await Student.create({
      admissionNo,
      tenantId: admission.tenantId,
      schoolId: admission.schoolId,
      classId: admission.classApplied,
      section: req.body.section || classData?.sections[0] || 'A',
      academicSession: admission.academicSession,
      personalInfo: admission.studentInfo,
      contactInfo: admission.contactInfo,
      parentInfo: admission.parentInfo,
      documents: admission.documents,
      customFields: admission.customFields
    });

    // Update class strength
    if (classData) {
      classData.currentStrength += 1;
      await classData.save();
    }

    // Update admission
    admission.enrolledStudentId = student._id;
    admission.status = 'enrolled';
    await admission.save();

    res.status(201).json({
      success: true,
      student,
      admission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete admission
// @route   DELETE /api/admissions/:id
// @access  Private (School Admin)
exports.deleteAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }

    // Check tenant access
    if (admission.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this admission'
      });
    }

    // Don't allow deletion if enrolled
    if (admission.enrolledStudentId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete enrolled admission'
      });
    }

    await admission.remove();

    res.status(200).json({
      success: true,
      message: 'Admission deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
