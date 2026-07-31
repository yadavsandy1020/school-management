const mongoose = require('mongoose');
const FeeStructure = require('../models/FeeStructure');
const FeeInvoice = require('../models/FeeInvoice');
const Student = require('../models/Student');
const Class = require('../models/Class');
const TransportAllocation = require('../models/TransportAllocation');
const Route = require('../models/Route');
const { buildPaginationResponse } = require('../middleware/pagination');
const { getNextNumber } = require('../services/sequenceService');
const { generateInstallmentInvoices: generateInstallments } = require('../services/installmentHelper');
const DocumentEngineOrchestrator = require('../services/documentEngines');
const documentEngine = new DocumentEngineOrchestrator();

const QUARTERS = {
  Q1: { name: 'Q1 (Apr–Jun)', months: [3, 4, 5] },
  Q2: { name: 'Q2 (Jul–Sep)', months: [6, 7, 8] },
  Q3: { name: 'Q3 (Oct–Dec)', months: [9, 10, 11] },
  Q4: { name: 'Q4 (Jan–Mar)', months: [0, 1, 2] }
};

// @desc    Create fee structure
// @route   POST /api/fees/structure
// @access  Private (School Admin)
exports.createFeeStructure = async (req, res) => {
  try {
    const { name, classId, academicSession, fees, lateFee, discount } = req.body;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, error: 'Please select a valid class' });
    }

    const classData = await Class.findOne({
      _id: classId,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      isActive: true
    });

    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    if (!Array.isArray(fees) || fees.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one fee item is required' });
    }

    const totalAmount = fees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);

    const feeStructure = await FeeStructure.create({
      name, tenantId: req.user.tenantId, schoolId: req.user.schoolId,
      classId, academicSession, fees, totalAmount, lateFee, discount
    });

    await Class.findOneAndUpdate({ _id: classId, tenantId: req.user.tenantId, schoolId: req.user.schoolId }, { feeStructure: feeStructure._id });

    res.status(201).json({ success: true, feeStructure });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all fee structures
// @route   GET /api/fees/structure
// @access  Private
exports.getFeeStructures = async (req, res) => {
  try {
    const { classId, academicSession } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true };
    if (classId) filter.classId = classId;
    if (academicSession) filter.academicSession = academicSession;

    const feeStructures = await FeeStructure.find(filter)
      .populate('classId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: feeStructures.length, feeStructures });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getFeeStructure = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid fee structure ID' });
    }

    const feeStructure = await FeeStructure.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      isActive: true
    }).populate('classId', 'name');

    if (!feeStructure) {
      return res.status(404).json({ success: false, error: 'Fee structure not found' });
    }

    res.status(200).json({ success: true, feeStructure });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update fee structure
// @route   PUT /api/fees/structure/:id
// @access  Private (School Admin)
exports.updateFeeStructure = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid fee structure ID' });
    }

    let feeStructure = await FeeStructure.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      isActive: true
    });

    if (!feeStructure) {
      return res.status(404).json({ success: false, error: 'Fee structure not found' });
    }

    const { name, classId, academicSession, fees, lateFee, discount } = req.body;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, error: 'Please select a valid class' });
    }

    const classData = await Class.findOne({
      _id: classId,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      isActive: true
    });

    if (!classData) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    if (!Array.isArray(fees) || fees.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one fee item is required' });
    }

    const totalAmount = fees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    const previousClassId = feeStructure.classId.toString();

    feeStructure = await FeeStructure.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
      { name, classId, academicSession, fees, totalAmount, lateFee, discount },
      { new: true, runValidators: true }
    );

    if (previousClassId !== classId) {
      await Class.findOneAndUpdate({ _id: previousClassId, tenantId: req.user.tenantId, schoolId: req.user.schoolId }, { $unset: { feeStructure: 1 } });
    }
    await Class.findOneAndUpdate({ _id: classId, tenantId: req.user.tenantId, schoolId: req.user.schoolId }, { feeStructure: feeStructure._id });

    res.status(200).json({ success: true, feeStructure });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate invoice (3 installments: admission in 1st, rest divided by 3)
// @route   POST /api/fees/invoice
// @access  Private (School Admin)
exports.generateInvoice = async (req, res) => {
  try {
    const { studentId, feeStructureId, dueDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(feeStructureId)) {
      return res.status(400).json({ success: false, error: 'Please select a valid student and fee structure' });
    }

    const [student, feeStructure] = await Promise.all([
      Student.findOne({ _id: studentId, tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true }),
      FeeStructure.findOne({ _id: feeStructureId, tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true })
    ]);

    if (!student || !feeStructure) {
      return res.status(404).json({ success: false, error: 'Student or fee structure not found' });
    }

    if (student.classId.toString() !== feeStructure.classId.toString()) {
      return res.status(400).json({ success: false, error: 'The selected fee structure does not apply to this student class' });
    }

    // Check for transport allocation
    const transportAlloc = await TransportAllocation.findOne({
      studentId: student._id,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      isActive: true
    }).populate('routeId', 'name');

    const invoices = await generateInstallments(student, feeStructure, {
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      academicSession: feeStructure.academicSession
    }, {
      dueDate: dueDate ? new Date(dueDate) : undefined,
      transportAlloc
    });

    res.status(201).json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all invoices
// @route   GET /api/fees/invoice
// @access  Private
exports.getInvoices = async (req, res) => {
  try {
    const { studentId, classId, status, academicSession } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId };
    if (studentId) filter.studentId = studentId;
    if (classId) filter.classId = classId;
    if (status) filter.status = status;
    if (academicSession) filter.academicSession = academicSession;

    if (req.user.role === 'parent') {
      filter.studentId = req.user.studentId;
    }

    const { page, limit, skip } = req.pagination;
    const total = await FeeInvoice.countDocuments(filter);
    const invoices = await FeeInvoice.find(filter)
      .populate('studentId', 'admissionNo personalInfo')
      .populate('classId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(buildPaginationResponse(invoices, total, page, limit));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/fees/invoice/:id
// @access  Private
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await FeeInvoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId })
      .populate('studentId', 'personalInfo contactInfo')
      .populate('classId', 'name')
      .populate('feeStructureId', 'name')
      .populate('payments.receivedBy', 'name');

    if (!invoice || invoice.tenantId !== req.user.tenantId) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    if (req.user.role === 'parent') {
      if (invoice.studentId._id.toString() !== req.user.studentId.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to access this invoice' });
      }
    }

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Record payment
// @route   POST /api/fees/invoice/:id/payment
// @access  Private (School Admin)
exports.recordPayment = async (req, res) => {
  try {
    const { amount, transactionId, remarks } = req.body;
    const paymentMode = req.body.paymentMode || req.body.paymentMethod;
    const paymentDate = req.body.paymentDate || req.body.paidDate;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid invoice ID' });
    }

    const invoice = await FeeInvoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const paymentAmount = Number(amount);
    const allowedModes = ['cash', 'bank_transfer', 'cheque', 'upi', 'online'];
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0 || paymentAmount > invoice.balanceAmount) {
      return res.status(400).json({ success: false, error: 'Payment amount must be greater than zero and cannot exceed the outstanding balance' });
    }
    if (!allowedModes.includes(paymentMode)) {
      return res.status(400).json({ success: false, error: 'Invalid payment mode' });
    }

    const resolvedPaymentDate = paymentDate ? new Date(paymentDate) : new Date();
    const receiptNo = await getNextNumber({
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      entityType: 'feeReceipt',
      academicSession: invoice.academicSession
    });
    invoice.payments.push({
      amount: paymentAmount,
      paymentDate: resolvedPaymentDate,
      paymentMode,
      transactionId,
      receiptNo,
      receivedBy: req.user.id,
      remarks
    });

    invoice.paidAmount += paymentAmount;
    invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

    if (invoice.balanceAmount <= 0) invoice.status = 'paid';
    else if (invoice.paidAmount > 0) invoice.status = 'partial';

    await invoice.save();
    res.status(200).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate receipt PDF
// @route   GET /api/fees/invoice/:id/receipt
// @access  Private
exports.generateReceipt = async (req, res) => {
  try {
    const invoice = await FeeInvoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId })
      .populate('studentId', 'admissionNo personalInfo contactInfo')
      .populate('schoolId', 'name shortName address contact documentSettings logo')
      .populate('classId', 'name')
      .populate({ path: 'payments.receivedBy', select: 'name' });

    if (!invoice || invoice.tenantId !== req.user.tenantId) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    if (req.user.role === 'parent') {
      if (invoice.studentId._id.toString() !== req.user.studentId.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to access this receipt' });
      }
    }

    const lastPayment = invoice.payments[invoice.payments.length - 1];
    if (!lastPayment) {
      return res.status(400).json({ success: false, error: 'No payment found' });
    }

    const payments = invoice.payments.map(p => ({
      receiptNo: p.receiptNo,
      date: new Date(p.paymentDate).toLocaleDateString(),
      amount: p.amount,
      mode: p.paymentMode,
      transactionId: p.transactionId || '-',
      receivedBy: p.receivedBy?.name || ''
    }));

    const pdfBuffer = await documentEngine.generate('feeReceipt', {
      schoolId: invoice.schoolId?._id || req.user.schoolId,
      receiptNumber: lastPayment.receiptNo,
      paymentDate: new Date(lastPayment.paymentDate).toLocaleDateString(),
      paymentMode: lastPayment.paymentMode,
      transactionId: lastPayment.transactionId,
      remarks: lastPayment.remarks,
      amount: lastPayment.amount,
      receivedBy: lastPayment.receivedBy?.name || '',
      academicSession: invoice.academicSession,
      className: invoice.classId?.name || '',
      admissionNo: invoice.studentId?.admissionNo || '',
      payments,
      invoice: {
        invoiceNumber: invoice.invoiceNo,
        subtotal: invoice.subtotal,
        lateFee: invoice.lateFee,
        discount: invoice.discount,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        balanceAmount: invoice.balanceAmount,
        items: invoice.items
      },
      student: `${invoice.studentId.personalInfo.firstName} ${invoice.studentId.personalInfo.lastName}`
    });

    const filename = `receipt-${invoice.invoiceNo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

    invoice.receiptGenerated = true;
    await invoice.save();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Bulk generate invoices (3 installments per student: admission in 1st, rest divided by 3)
// @route   POST /api/fees/invoice/bulk
// @access  Private (School Admin)
exports.bulkGenerateInvoices = async (req, res) => {
  try {
    const { classId, feeStructureId, dueDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(feeStructureId)) {
      return res.status(400).json({ success: false, error: 'Please select a valid class and fee structure' });
    }

    const [students, feeStructure] = await Promise.all([
      Student.find({ classId, tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true }),
      FeeStructure.findOne({ _id: feeStructureId, classId, tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true })
    ]);

    if (!feeStructure) {
      return res.status(404).json({ success: false, error: 'Fee structure not found for this class' });
    }

    // Get transport allocations for all students in this class
    const studentIds = students.map(s => s._id);
    const transportAllocs = await TransportAllocation.find({
      studentId: { $in: studentIds },
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      isActive: true
    }).populate('routeId', 'name');

    const transportMap = new Map();
    transportAllocs.forEach(alloc => {
      transportMap.set(alloc.studentId.toString(), alloc);
    });

    const results = [];
    for (const student of students) {
      const transportAlloc = transportMap.get(student._id.toString());
      const invoices = await generateInstallments(student, feeStructure, {
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        academicSession: feeStructure.academicSession
      }, {
        dueDate: dueDate ? new Date(dueDate) : undefined,
        transportAlloc
      });
      results.push(...invoices);
    }

    res.status(201).json({ success: true, generated: results.length, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid invoice ID' });
    }

    const invoice = await FeeInvoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    if (invoice.paidAmount > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete an invoice with recorded payments' });
    }

    await invoice.deleteOne();
    res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteFeeStructure = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid fee structure ID' });
    }

    const feeStructure = await FeeStructure.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (!feeStructure) {
      return res.status(404).json({ success: false, error: 'Fee structure not found' });
    }

    const invoiceCount = await FeeInvoice.countDocuments({ feeStructureId: feeStructure._id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (invoiceCount > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete a fee structure used by invoices' });
    }

    await Class.updateMany({ feeStructure: feeStructure._id, tenantId: req.user.tenantId, schoolId: req.user.schoolId }, { $unset: { feeStructure: 1 } });
    await feeStructure.deleteOne();
    res.status(200).json({ success: true, message: 'Fee structure deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate invoices for all students in a class (3 installments: admission in 1st, rest divided by 3)
// @route   POST /api/fees/invoice/quarterly
// @access  Private (School Admin)
exports.generateQuarterlyInvoices = async (req, res) => {
  try {
    const { classId, feeStructureId, dueDate, academicSession } = req.body;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ success: false, error: 'Valid class ID is required' });
    }
    if (!feeStructureId || !mongoose.Types.ObjectId.isValid(feeStructureId)) {
      return res.status(400).json({ success: false, error: 'Valid fee structure ID is required' });
    }

    const [students, feeStructure] = await Promise.all([
      Student.find({ classId, tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true }),
      FeeStructure.findOne({ _id: feeStructureId, tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true })
    ]);

    if (!feeStructure) {
      return res.status(404).json({ success: false, error: 'Fee structure not found' });
    }

    // Get transport allocations for all students in this class
    const studentIds = students.map(s => s._id);
    const transportAllocs = await TransportAllocation.find({
      studentId: { $in: studentIds },
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      isActive: true
    }).populate('routeId', 'name stops');

    const transportMap = new Map();
    transportAllocs.forEach(alloc => {
      transportMap.set(alloc.studentId.toString(), alloc);
    });

    const results = [];
    const errors = [];

    for (const student of students) {
      // Check if invoices already exist for this student + session
      const existing = await FeeInvoice.findOne({
        studentId: student._id,
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        academicSession: academicSession || feeStructure.academicSession,
        feeStructureId
      });
      if (existing) {
        errors.push({ student: student.admissionNo, error: 'Invoices already exist for this student' });
        continue;
      }

      const transportAlloc = transportMap.get(student._id.toString());
      const invoices = await generateInstallments(student, feeStructure, {
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        academicSession: academicSession || feeStructure.academicSession
      }, {
        dueDate: dueDate ? new Date(dueDate) : undefined,
        transportAlloc
      });
      results.push(...invoices);
    }

    res.status(201).json({
      success: true,
      generated: results.length,
      skipped: errors.length,
      results,
      errors
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get student payment report (all invoices + payments as PDF)
// @route   GET /api/fees/student/:studentId/payment-report
// @access  Private
exports.getStudentPaymentReport = async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, tenantId: req.user.tenantId, schoolId: req.user.schoolId })
      .populate('classId', 'name');

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    if (req.user.role === 'parent') {
      if (student._id.toString() !== req.user.studentId?.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }
    }

    const invoices = await FeeInvoice.find({
      studentId: student._id,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId
    }).populate('classId', 'name').sort({ createdAt: 1 });

    const allPayments = [];
    let totalBilled = 0, totalPaid = 0;

    invoices.forEach(inv => {
      totalBilled += Number(inv.totalAmount || 0);
      totalPaid += Number(inv.paidAmount || 0);
      inv.payments.forEach(p => {
        allPayments.push({
          invoiceNo: inv.invoiceNo,
          quarter: inv.quarter,
          receiptNo: p.receiptNo,
          date: new Date(p.paymentDate).toLocaleDateString(),
          amount: p.amount,
          mode: p.paymentMode,
          transactionId: p.transactionId || '-',
          remarks: p.remarks || ''
        });
      });
    });

    const pdfBuffer = await documentEngine.generate('paymentReport', {
      schoolId: req.user.schoolId,
      student: `${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`,
      admissionNo: student.admissionNo,
      className: student.classId?.name || '',
      section: student.section || '',
      academicSession: student.academicSession || '',
      totalBilled,
      totalPaid,
      totalOutstanding: totalBilled - totalPaid,
      invoices: invoices.map(inv => ({
        invoiceNo: inv.invoiceNo,
        quarter: inv.quarter || '-',
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        balanceAmount: inv.balanceAmount,
        status: inv.status,
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-',
        items: inv.items,
        payments: inv.payments.map(p => ({
          receiptNo: p.receiptNo,
          date: new Date(p.paymentDate).toLocaleDateString(),
          amount: p.amount,
          mode: p.paymentMode,
          transactionId: p.transactionId || '-'
        }))
      })),
      allPayments
    });

    const filename = `payment-report-${student.admissionNo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get fee defaulters list
// @route   GET /api/fees/defaulters
// @access  Private (School Admin)
exports.getFeeDefaulters = async (req, res) => {
  try {
    const { academicSession, classId } = req.query;
    const now = new Date();
    const filter = {
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      balanceAmount: { $gt: 0 },
      dueDate: { $lt: now }
    };

    if (academicSession) filter.academicSession = academicSession;
    if (classId) filter.classId = classId;

    if (req.user.role === 'parent') {
      filter.studentId = req.user.studentId;
    }

    const invoices = await FeeInvoice.find(filter)
      .populate('studentId', 'admissionNo rollNo personalInfo contactInfo')
      .populate('classId', 'name')
      .sort({ dueDate: 1 });

    const defaulters = invoices.map(inv => ({
      invoiceId: inv._id,
      invoiceNo: inv.invoiceNo,
      installmentLabel: inv.installmentLabel,
      studentName: inv.studentId ? `${inv.studentId.personalInfo?.firstName} ${inv.studentId.personalInfo?.lastName}` : 'Unknown',
      admissionNo: inv.studentId?.admissionNo,
      rollNo: inv.studentId?.rollNo,
      className: inv.classId?.name,
      section: inv.studentId?.section,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      balanceAmount: inv.balanceAmount,
      status: inv.status,
      dueDate: inv.dueDate,
      parentPhone: inv.studentId?.parentInfo?.fatherPhone || inv.studentId?.contactInfo?.phone
    }));

    const totalDue = defaulters.reduce((sum, d) => sum + d.balanceAmount, 0);

    res.status(200).json({
      success: true,
      count: defaulters.length,
      totalDue,
      data: defaulters
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
