const Admission = require('../models/Admission');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const FeeStructure = require('../models/FeeStructure');
const FeeInvoice = require('../models/FeeInvoice');
const { buildPaginationResponse } = require('../middleware/pagination');
const { getNextNumber } = require('../services/sequenceService');
const { generateInstallmentInvoices: generateInstallments } = require('../services/installmentHelper');

// @desc    Create admission application
// @route   POST /api/admissions
// @access  Public
exports.createAdmission = async (req, res) => {
  try {
    const {
      classApplied,
      section,
      studentInfo,
      contactInfo,
      parentInfo,
      previousEducation,
      documents,
      feeDiscount
    } = req.body;

    const classData = await Class.findOne({
      _id: classApplied,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      isActive: true
    });

    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    const academicSession = new Date().getFullYear().toString();
    // Generate application number
    const applicationNo = await getNextNumber({
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      entityType: 'admission',
      academicSession
    });

    const admission = await Admission.create({
      applicationNo,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      academicSession,
      classApplied,
      section: section || 'A',
      studentInfo,
      contactInfo,
      parentInfo,
      previousEducation,
      documents,
      feeDiscount
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
    const admission = await Admission.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId })
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
    let admission = await Admission.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

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

    const { studentInfo, contactInfo, parentInfo, previousEducation, documents, remarks, feeDiscount } = req.body;

    admission = await Admission.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
      { studentInfo, contactInfo, parentInfo, previousEducation, documents, remarks, feeDiscount },
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
    const admission = await Admission.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

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

// Helper: create a student record from an approved admission
const createStudentFromAdmission = async (admission, req) => {
  const classData = await Class.findOne({
    _id: admission.classApplied,
    tenantId: req.user.tenantId,
    schoolId: req.user.schoolId,
    isActive: true
  });

  if (!classData) {
    throw new Error('Class not found');
  }

  // Generate admission/student number
  const admissionNo = await getNextNumber({
    tenantId: admission.tenantId,
    schoolId: admission.schoolId,
    entityType: 'student',
    academicSession: admission.academicSession
  });

  const student = await Student.create({
    admissionNo,
    tenantId: admission.tenantId,
    schoolId: admission.schoolId,
    classId: admission.classApplied,
    section: admission.section || req.body.section || classData?.sections?.[0] || 'A',
    academicSession: admission.academicSession,
    personalInfo: admission.studentInfo,
    contactInfo: admission.contactInfo,
    parentInfo: admission.parentInfo,
    documents: admission.documents,
    customFields: admission.customFields,
    feeDiscount: req.body.feeDiscount || admission.feeDiscount || { type: 'fixed', amount: 0, reason: '' },
    admissionDate: admission.approvedDate || Date.now()
  });

  // Update class strength
  classData.currentStrength += 1;
  await classData.save();

  return student;
};

// Helper: generate installment invoices for a newly enrolled student
// Uses shared installmentHelper — admission fee in 1st installment, rest divided by 3.
const generateInstallmentInvoices = async (student, admission, req) => {
  const feeStructure = await FeeStructure.findOne({
    classId: student.classId,
    tenantId: student.tenantId,
    schoolId: student.schoolId,
    isActive: true
  }).sort({ createdAt: -1 });

  if (!feeStructure) return [];

  return generateInstallments(student, feeStructure, {
    tenantId: student.tenantId,
    schoolId: student.schoolId,
    academicSession: student.academicSession
  });
};

// @desc    Approve admission and create student record
// @route   PUT /api/admissions/:id/approve
// @access  Private (School Admin)
exports.approveAdmission = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

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

    if (admission.status === 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'Rejected admissions cannot be approved'
      });
    }

    if (admission.status === 'enrolled') {
      // Check if the linked student is still active
      const existingStudent = await Student.findOne({ _id: admission.enrolledStudentId, isActive: true });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          error: 'Admission is already enrolled. Delete the student first to re-enroll.'
        });
      }
      // Student was deleted — allow re-enrollment
    }

    admission.status = 'approved';
    admission.approvedBy = req.user.id;
    admission.approvedDate = Date.now();
    admission.remarks = req.body.remarks;

    // Create student record on approval
    const student = await createStudentFromAdmission(admission, req);
    admission.enrolledStudentId = student._id;
    admission.status = 'enrolled';

    // Generate installment invoices (first installment marked as paid)
    const invoices = await generateInstallmentInvoices(student, admission, req);

    await admission.save();

    res.status(200).json({
      success: true,
      admission,
      student,
      invoices
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
    const admission = await Admission.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

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

// @desc    Enroll admission as student (idempotent wrapper around approval flow)
// @route   POST /api/admissions/:id/enroll
// @access  Private (School Admin)
exports.enrollStudent = async (req, res) => {
  try {
    const admission = await Admission.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!admission) {
      return res.status(404).json({
        success: false,
        error: 'Admission not found'
      });
    }

    if (admission.tenantId !== req.user.tenantId || admission.schoolId.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to enroll this admission'
      });
    }

    // Return existing student if already enrolled
    if (admission.enrolledStudentId) {
      const student = await Student.findById(admission.enrolledStudentId);
      return res.status(200).json({
        success: true,
        message: 'Student already enrolled',
        student,
        admission
      });
    }

    if (admission.status === 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'Cannot enroll a rejected admission'
      });
    }

    // Approve and create student
    admission.status = 'approved';
    admission.approvedBy = req.user.id;
    admission.approvedDate = Date.now();

    const student = await createStudentFromAdmission(admission, req);
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
    const admission = await Admission.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

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

    await admission.deleteOne();

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
