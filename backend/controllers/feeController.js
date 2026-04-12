const FeeStructure = require('../models/FeeStructure');
const FeeInvoice = require('../models/FeeInvoice');
const Student = require('../models/Student');
const PDFDocument = require('pdfkit');
const { buildPaginationResponse } = require('../middleware/pagination');

// @desc    Create fee structure
// @route   POST /api/fees/structure
// @access  Private (School Admin)
exports.createFeeStructure = async (req, res) => {
  try {
    const { name, classId, academicSession, fees, lateFee, discount } = req.body;
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);

    const feeStructure = await FeeStructure.create({
      name, tenantId: req.user.tenantId, schoolId: req.user.schoolId,
      classId, academicSession, fees, totalAmount, lateFee, discount
    });

    const Class = require('../models/Class');
    await Class.findByIdAndUpdate(classId, { feeStructure: feeStructure._id });

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

// @desc    Update fee structure
// @route   PUT /api/fees/structure/:id
// @access  Private (School Admin)
exports.updateFeeStructure = async (req, res) => {
  try {
    let feeStructure = await FeeStructure.findById(req.params.id);
    if (!feeStructure || feeStructure.tenantId !== req.user.tenantId) {
      return res.status(404).json({ success: false, error: 'Fee structure not found' });
    }

    const { name, fees, lateFee, discount } = req.body;
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);

    feeStructure = await FeeStructure.findByIdAndUpdate(
      req.params.id, { name, fees, totalAmount, lateFee, discount },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, feeStructure });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate invoice
// @route   POST /api/fees/invoice
// @access  Private (School Admin)
exports.generateInvoice = async (req, res) => {
  try {
    const { studentId, feeStructureId, dueDate, items } = req.body;
    const student = await Student.findById(studentId);
    const feeStructure = await FeeStructure.findById(feeStructureId);

    if (!student || !feeStructure) {
      return res.status(404).json({ success: false, error: 'Student or fee structure not found' });
    }

    const invoiceNo = 'INV-' + Date.now().toString().slice(-8);
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

    const invoice = await FeeInvoice.create({
      invoiceNo, tenantId: req.user.tenantId, schoolId: req.user.schoolId,
      studentId, classId: student.classId, academicSession: feeStructure.academicSession,
      feeStructureId, items, subtotal, totalAmount: subtotal, balanceAmount: subtotal, dueDate: new Date(dueDate)
    });

    res.status(201).json({ success: true, invoice });
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
    const invoice = await FeeInvoice.findById(req.params.id)
      .populate('studentId', 'personalInfo contactInfo')
      .populate('classId', 'name')
      .populate('feeStructureId', 'name')
      .populate('payments.receivedBy', 'name');

    if (!invoice || invoice.tenantId !== req.user.tenantId) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
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
    const { amount, paymentMode, transactionId, remarks } = req.body;
    const invoice = await FeeInvoice.findById(req.params.id);

    if (!invoice || invoice.tenantId !== req.user.tenantId) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const receiptNo = 'RCPT-' + Date.now().toString().slice(-8);
    invoice.payments.push({
      amount, paymentDate: Date.now(), paymentMode, transactionId,
      receiptNo, receivedBy: req.user.id, remarks
    });

    invoice.paidAmount += amount;
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
    const invoice = await FeeInvoice.findById(req.params.id)
      .populate('studentId', 'personalInfo contactInfo')
      .populate('schoolId', 'name address contact');

    if (!invoice || invoice.tenantId !== req.user.tenantId) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const lastPayment = invoice.payments[invoice.payments.length - 1];
    if (!lastPayment) {
      return res.status(400).json({ success: false, error: 'No payment found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `receipt-${invoice.invoiceNo}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.fontSize(20).text(invoice.schoolId.name, { align: 'center' });
    doc.fontSize(10).text(invoice.schoolId.address.street || '', { align: 'center' });
    doc.text(`${invoice.schoolId.address.city || ''}, ${invoice.schoolId.address.state || ''}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('FEE RECEIPT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Receipt No: ${lastPayment.receiptNo}`);
    doc.text(`Date: ${new Date(lastPayment.paymentDate).toLocaleDateString()}`);
    doc.text(`Invoice No: ${invoice.invoiceNo}`);
    doc.moveDown();
    doc.text('Student Details:');
    doc.text(`Name: ${invoice.studentId.personalInfo.firstName} ${invoice.studentId.personalInfo.lastName}`);
    doc.moveDown();
    doc.text('Payment Details:');
    doc.text(`Amount Paid: ₹${lastPayment.amount}`);
    doc.text(`Payment Mode: ${lastPayment.paymentMode.toUpperCase()}`);
    if (lastPayment.transactionId) doc.text(`Transaction ID: ${lastPayment.transactionId}`);
    doc.moveDown();
    doc.text('Fee Breakdown:');
    invoice.items.forEach(item => doc.text(`${item.name}: ₹${item.amount}`));
    doc.moveDown();
    doc.text(`Total Amount: ₹${invoice.totalAmount}`);
    doc.text(`Paid Amount: ₹${invoice.paidAmount}`);
    doc.text(`Balance: ₹${invoice.balanceAmount}`);
    doc.moveDown();
    doc.fontSize(10).text('This is a computer-generated receipt.', { align: 'center' });
    doc.end();

    invoice.receiptGenerated = true;
    await invoice.save();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Bulk generate invoices
// @route   POST /api/fees/invoice/bulk
// @access  Private (School Admin)
exports.bulkGenerateInvoices = async (req, res) => {
  try {
    const { classId, feeStructureId, dueDate } = req.body;
    const students = await Student.find({ classId, tenantId: req.user.tenantId, isActive: true });
    const feeStructure = await FeeStructure.findById(feeStructureId);

    if (!feeStructure) {
      return res.status(404).json({ success: false, error: 'Fee structure not found' });
    }

    const results = [];
    for (const student of students) {
      const invoiceNo = 'INV-' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4);
      const invoice = await FeeInvoice.create({
        invoiceNo, tenantId: req.user.tenantId, schoolId: req.user.schoolId,
        studentId: student._id, classId: student.classId,
        academicSession: feeStructure.academicSession, feeStructureId,
        items: feeStructure.fees, subtotal: feeStructure.totalAmount,
        totalAmount: feeStructure.totalAmount, balanceAmount: feeStructure.totalAmount,
        dueDate: new Date(dueDate)
      });
      results.push(invoice);
    }

    res.status(201).json({ success: true, generated: results.length, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
