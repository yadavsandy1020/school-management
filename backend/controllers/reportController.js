const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Attendance = require('../models/Attendance');
const FeeInvoice = require('../models/FeeInvoice');
const Class = require('../models/Class');
const Notice = require('../models/Notice');
const TeacherSalaryPayment = require('../models/TeacherSalaryPayment');
const SchoolExpense = require('../models/SchoolExpense');
const MarksEntry = require('../models/MarksEntry');
const Exam = require('../models/Exam');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const schoolId = req.user.schoolId;

    // Get counts
    const studentCount = await Student.countDocuments({ tenantId, schoolId, isActive: true });
    const teacherCount = await Teacher.countDocuments({ tenantId, schoolId, isActive: true });
    const classCount = await Class.countDocuments({ tenantId, schoolId, isActive: true });
    const noticeCount = await Notice.countDocuments({ tenantId, schoolId, isActive: true });

    // Get fee collection stats
    const feeInvoices = await FeeInvoice.find({ tenantId, schoolId });
    const totalFees = feeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const collectedFees = feeInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const pendingFees = totalFees - collectedFees;

    // Get salary & expense totals
    const salaryPayments = await TeacherSalaryPayment.find({ tenantId, schoolId });
    const totalSalaryPaid = salaryPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const activeTeachers = await Teacher.find({ tenantId, schoolId, isActive: true });
    const totalMonthlySalary = activeTeachers.reduce((sum, teacher) => sum + (teacher.salaryDetails?.totalSalary || 0), 0);
    const expenses = await SchoolExpense.find({ tenantId, schoolId });
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.findOne({
      tenantId,
      schoolId,
      date: today
    });

    const attendanceStats = todayAttendance ? {
      total: todayAttendance.totalStudents,
      present: todayAttendance.presentCount,
      absent: todayAttendance.absentCount,
      percentage: todayAttendance.totalStudents > 0
        ? ((todayAttendance.presentCount / todayAttendance.totalStudents) * 100).toFixed(2)
        : 0
    } : { total: 0, present: 0, absent: 0, percentage: 0 };

    res.status(200).json({
      success: true,
      stats: {
        students: studentCount,
        teachers: teacherCount,
        classes: classCount,
        notices: noticeCount,
        fees: {
          total: totalFees,
          collected: collectedFees,
          pending: pendingFees,
          collectionRate: totalFees > 0 ? ((collectedFees / totalFees) * 100).toFixed(2) : 0
        },
        finances: {
          salaries: {
            totalPayable: totalMonthlySalary,
            paid: totalSalaryPaid,
            due: totalMonthlySalary - totalSalaryPaid
          },
          expenses: totalExpenses,
          net: collectedFees - totalSalaryPaid - totalExpenses
        },
        attendance: attendanceStats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get attendance report
// @route   GET /api/reports/attendance
// @access  Private
exports.getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, classId, section } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (classId) filter.classId = classId;
    if (section) filter.section = section;

    const attendance = await Attendance.find(filter)
      .populate('classId', 'name')
      .sort({ date: -1 });

    // Calculate aggregate statistics
    const totalDays = attendance.length;
    const totalPresent = attendance.reduce((sum, att) => sum + att.presentCount, 0);
    const totalAbsent = attendance.reduce((sum, att) => sum + att.absentCount, 0);
    const avgPercentage = totalDays > 0 ? ((totalPresent / (totalPresent + totalAbsent)) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalDays,
        totalPresent,
        totalAbsent,
        avgPercentage: parseFloat(avgPercentage)
      },
      attendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get fee collection report
// @route   GET /api/reports/fees
// @access  Private
exports.getFeeReport = async (req, res) => {
  try {
    const { startDate, endDate, classId, status } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId };

    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (classId) filter.classId = classId;
    if (status) filter.status = status;

    const invoices = await FeeInvoice.find(filter)
      .populate('studentId', 'admissionNo personalInfo')
      .populate('classId', 'name')
      .sort({ createdAt: -1 });

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const collectedAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const pendingAmount = totalAmount - collectedAmount;

    const statusBreakdown = {
      pending: invoices.filter(i => i.status === 'pending').length,
      partial: invoices.filter(i => i.status === 'partial').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length
    };

    res.status(200).json({
      success: true,
      summary: {
        totalInvoices: invoices.length,
        totalAmount,
        collectedAmount,
        pendingAmount,
        statusBreakdown
      },
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

// @desc    Get student strength report
// @route   GET /api/reports/strength
// @access  Private
exports.getStrengthReport = async (req, res) => {
  try {
    const classes = await Class.find({
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      isActive: true
    }).sort({ name: 1 });

    const report = await Promise.all(classes.map(async (cls) => {
      const sectionBreakdown = await Promise.all(
        cls.sections.map(async (section) => {
          const count = await Student.countDocuments({
            classId: cls._id,
            section,
            tenantId: req.user.tenantId,
            isActive: true
          });
          return { section, count };
        })
      );

      const totalStudents = sectionBreakdown.reduce((sum, s) => sum + s.count, 0);

      return {
        class: cls.name,
        sections: sectionBreakdown,
        totalStudents,
        capacity: cls.capacity
      };
    }));

    const totalStudents = report.reduce((sum, r) => sum + r.totalStudents, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalClasses: classes.length,
        totalStudents
      },
      report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Export report to CSV
// @route   GET /api/reports/export/:type
// @access  Private
exports.exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    const { classId, startDate, endDate } = req.query;

    let data = [];
    let filename = '';
    let headers = [];

    switch (type) {
      case 'students':
        const studentFilter = {
          tenantId: req.user.tenantId,
          schoolId: req.user.schoolId,
          isActive: true
        };
        if (classId) studentFilter.classId = classId;

        data = await Student.find(studentFilter)
          .populate('classId', 'name')
          .sort({ admissionNo: 1 });

        headers = ['Admission No', 'Name', 'Class', 'Section', 'Father Name', 'Phone'];
        filename = 'students.csv';
        break;

      case 'teachers':
        data = await Teacher.find({
          tenantId: req.user.tenantId,
          schoolId: req.user.schoolId,
          isActive: true
        }).sort({ 'personalInfo.firstName': 1 });

        headers = ['Employee ID', 'Name', 'Designation', 'Phone', 'Email'];
        filename = 'teachers.csv';
        break;

      case 'fees':
        const feeFilter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId };
        if (startDate && endDate) {
          feeFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        data = await FeeInvoice.find(feeFilter)
          .populate('studentId', 'personalInfo')
          .populate('classId', 'name')
          .sort({ createdAt: -1 });

        headers = ['Invoice No', 'Student Name', 'Class', 'Total Amount', 'Paid', 'Balance', 'Status'];
        filename = 'fees.csv';
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid report type'
        });
    }

    // Convert to CSV
    const csvRows = [headers.join(',')];

    data.forEach(item => {
      const row = [];
      if (type === 'students') {
        row.push(item.admissionNo);
        row.push(`${item.personalInfo.firstName} ${item.personalInfo.lastName}`);
        row.push(item.classId?.name || '');
        row.push(item.section);
        row.push(item.parentInfo?.fatherName || '');
        row.push(item.contactInfo?.phone || '');
      } else if (type === 'teachers') {
        row.push(item.employeeId);
        row.push(`${item.personalInfo.firstName} ${item.personalInfo.lastName}`);
        row.push(item.employmentDetails?.designation || '');
        row.push(item.contactInfo?.phone || '');
        row.push(item.contactInfo?.email || '');
      } else if (type === 'fees') {
        row.push(item.invoiceNo);
        row.push(`${item.studentId?.personalInfo?.firstName} ${item.studentId?.personalInfo?.lastName}`);
        row.push(item.classId?.name || '');
        row.push(item.totalAmount);
        row.push(item.paidAmount);
        row.push(item.balanceAmount);
        row.push(item.status);
      }
      csvRows.push(row.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getTrendsReport = async (req, res) => {
  try {
    const { year } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId };
    const targetYear = year ? Number(year) : new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const feeTrend = await Promise.all(months.map(async (_, index) => {
      const start = new Date(targetYear, index, 1);
      const end = new Date(targetYear, index + 1, 0, 23, 59, 59);
      const invoices = await FeeInvoice.find({ ...filter, createdAt: { $gte: start, $lte: end } });
      return invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    }));

    const expenseTrend = await Promise.all(months.map(async (_, index) => {
      const start = new Date(targetYear, index, 1);
      const end = new Date(targetYear, index + 1, 0, 23, 59, 59);
      const expenses = await SchoolExpense.find({ ...filter, date: { $gte: start, $lte: end } });
      return expenses.reduce((sum, ex) => sum + ex.amount, 0);
    }));

    const attendanceTrend = await Promise.all(months.map(async (_, index) => {
      const start = new Date(targetYear, index, 1);
      const end = new Date(targetYear, index + 1, 0, 23, 59, 59);
      const records = await Attendance.find({ ...filter, date: { $gte: start, $lte: end } });
      const total = records.reduce((sum, r) => sum + r.totalStudents, 0);
      const present = records.reduce((sum, r) => sum + r.presentCount, 0);
      return total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0;
    }));

    res.status(200).json({ success: true, data: { months, feeTrend, expenseTrend, attendanceTrend } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getExamReport = async (req, res) => {
  try {
    const { examId } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId, examId };
    const marks = await MarksEntry.find(filter).populate('studentId', 'name').populate('subjectId', 'name');

    const studentTotals = {};
    for (const m of marks) {
      const sid = m.studentId?._id?.toString();
      if (!sid) continue;
      if (!studentTotals[sid]) studentTotals[sid] = { name: m.studentId.name, obtained: 0, max: 0 };
      studentTotals[sid].obtained += m.marksObtained;
      studentTotals[sid].max += m.maxMarks;
    }

    const results = Object.values(studentTotals).map(s => ({
      ...s,
      percentage: s.max > 0 ? ((s.obtained / s.max) * 100).toFixed(2) : 0
    })).sort((a, b) => b.percentage - a.percentage);

    const subjectAverages = {};
    for (const m of marks) {
      const sub = m.subjectId?.name || 'Unknown';
      if (!subjectAverages[sub]) subjectAverages[sub] = { total: 0, obtained: 0 };
      subjectAverages[sub].total += m.maxMarks;
      subjectAverages[sub].obtained += m.marksObtained;
    }
    const subjectWise = Object.entries(subjectAverages).map(([subject, vals]) => ({
      subject,
      average: vals.total > 0 ? ((vals.obtained / vals.total) * 100).toFixed(2) : 0
    }));

    res.status(200).json({ success: true, data: { results, subjectWise } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getFinanceReport = async (req, res) => {
  try {
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId };
    const invoices = await FeeInvoice.find(filter);
    const feesCollected = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const salaryPaid = (await TeacherSalaryPayment.find(filter)).reduce((sum, p) => sum + p.amount, 0);
    const expenses = (await SchoolExpense.find(filter)).reduce((sum, e) => sum + e.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        income: { fees: feesCollected },
        expenses: { salaries: salaryPaid, operational: expenses, total: salaryPaid + expenses },
        net: feesCollected - salaryPaid - expenses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
