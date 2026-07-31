const TeacherSalaryPayment = require('../models/TeacherSalaryPayment');
const SchoolExpense = require('../models/SchoolExpense');
const Teacher = require('../models/Teacher');
const { buildPaginationResponse } = require('../middleware/pagination');
const { getNextNumber } = require('../services/sequenceService');
const DocumentEngineOrchestrator = require('../services/documentEngines');
const documentEngine = new DocumentEngineOrchestrator();

// @desc    Record a teacher salary payment
// @route   POST /api/finance/salaries
// @access  Private (School Admin)
exports.recordSalary = async (req, res) => {
  try {
    const { teacherId, amount, month, year, paymentDate, paymentMode, transactionId, notes } = req.body;

    const teacher = await Teacher.findOne({ _id: teacherId, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }
    if (teacher.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Not authorized to record salary for this teacher' });
    }

    const paymentNumber = await getNextNumber({
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      entityType: 'salarySlip',
      academicSession: year.toString()
    });

    const payment = await TeacherSalaryPayment.create({
      paymentNumber,
      teacherId,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      amount,
      month,
      year,
      paymentDate: paymentDate || Date.now(),
      paymentMode,
      transactionId,
      notes,
      recordedBy: req.user._id
    });

    const populatedPayment = await payment.populate('teacherId', 'personalInfo employeeId');

    res.status(201).json({ success: true, payment: populatedPayment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all salary payments
// @route   GET /api/finance/salaries
// @access  Private (School Admin)
exports.getSalaries = async (req, res) => {
  try {
    const { month, year, teacherId } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId };

    if (month) filter.month = month;
    if (year) filter.year = Number(year);
    if (teacherId) filter.teacherId = teacherId;

    const { page, limit, skip } = req.pagination;
    const total = await TeacherSalaryPayment.countDocuments(filter);
    const payments = await TeacherSalaryPayment.find(filter)
      .populate('teacherId', 'personalInfo employeeId')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      ...buildPaginationResponse(payments, total, page, limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single salary payment
// @route   GET /api/finance/salaries/:id
// @access  Private (School Admin)
exports.getSalary = async (req, res) => {
  try {
    const payment = await TeacherSalaryPayment.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId })
      .populate('teacherId', 'personalInfo employeeId');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Salary payment not found' });
    }
    if (payment.tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this payment' });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update salary payment
// @route   PUT /api/finance/salaries/:id
// @access  Private (School Admin)
exports.updateSalary = async (req, res) => {
  try {
    const payment = await TeacherSalaryPayment.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Salary payment not found' });
    }

    const updated = await TeacherSalaryPayment.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('teacherId', 'personalInfo employeeId');

    res.status(200).json({ success: true, payment: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete salary payment
// @route   DELETE /api/finance/salaries/:id
// @access  Private (School Admin)
exports.deleteSalary = async (req, res) => {
  try {
    const payment = await TeacherSalaryPayment.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Salary payment not found' });
    }

    await payment.deleteOne();
    res.status(200).json({ success: true, message: 'Salary payment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Record a school expense
// @route   POST /api/finance/expenses
// @access  Private (School Admin)
exports.recordExpense = async (req, res) => {
  try {
    const { title, category, amount, date, description, paymentMode, receiptUrl } = req.body;

    const expenseNumber = await getNextNumber({
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      entityType: 'expense',
      academicSession: new Date(date || Date.now()).getFullYear().toString()
    });

    const expense = await SchoolExpense.create({
      expenseNumber,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      title,
      category,
      amount,
      date: date || Date.now(),
      description,
      paymentMode,
      receiptUrl,
      recordedBy: req.user._id
    });

    res.status(201).json({ success: true, expense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all school expenses
// @route   GET /api/finance/expenses
// @access  Private (School Admin)
exports.getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId };

    if (category) filter.category = category;
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const { page, limit, skip } = req.pagination;
    const total = await SchoolExpense.countDocuments(filter);
    const expenses = await SchoolExpense.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      ...buildPaginationResponse(expenses, total, page, limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single expense
// @route   GET /api/finance/expenses/:id
// @access  Private (School Admin)
exports.getExpense = async (req, res) => {
  try {
    const expense = await SchoolExpense.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    res.status(200).json({ success: true, expense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/finance/expenses/:id
// @access  Private (School Admin)
exports.updateExpense = async (req, res) => {
  try {
    const expense = await SchoolExpense.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    const updated = await SchoolExpense.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, expense: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/finance/expenses/:id
// @access  Private (School Admin)
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await SchoolExpense.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    await expense.deleteOne();
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Generate salary slip PDF
// @route   GET /api/finance/salaries/:id/slip
// @access  Private (School Admin)
exports.generateSalarySlip = async (req, res) => {
  try {
    const payment = await TeacherSalaryPayment.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId })
      .populate('teacherId', 'personalInfo employeeId employmentDetails salaryDetails contactInfo');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Salary payment not found' });
    }

    const teacher = payment.teacherId;
    const salaryDetails = teacher?.salaryDetails || {};

    const pdfBuffer = await documentEngine.generate('salarySlip', {
      schoolId: req.user.schoolId,
      paymentNumber: payment.paymentNumber,
      teacherName: teacher ? `${teacher.personalInfo?.firstName} ${teacher.personalInfo?.lastName}` : '',
      employeeName: teacher ? `${teacher.personalInfo?.firstName} ${teacher.personalInfo?.lastName}` : '',
      employeeId: teacher?.employeeId,
      designation: teacher?.employmentDetails?.designation,
      department: teacher?.employmentDetails?.department,
      month: payment.month,
      year: payment.year,
      paymentDate: new Date(payment.paymentDate).toLocaleDateString(),
      paymentMode: payment.paymentMode,
      transactionId: payment.transactionId,
      basicSalary: salaryDetails.basicSalary || 0,
      hra: salaryDetails.hra || 0,
      da: salaryDetails.da || 0,
      allowances: salaryDetails.allowances || 0,
      deductions: salaryDetails.deductions || 0,
      pf: salaryDetails.pf || 0,
      grossSalary: salaryDetails.totalSalary || payment.amount,
      netSalary: payment.amount,
      notes: payment.notes
    });

    const filename = `salary-slip-${payment.paymentNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
