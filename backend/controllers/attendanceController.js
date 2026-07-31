const Attendance = require('../models/Attendance');
const TeacherAttendance = require('../models/TeacherAttendance');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const CalendarEvent = require('../models/CalendarEvent');
const { buildPaginationResponse } = require('../middleware/pagination');

// @desc    Mark attendance for a class
// @route   POST /api/attendance
// @access  Private (Teacher, School Admin)
exports.markAttendance = async (req, res) => {
  try {
    const { date, classId, section, records } = req.body;

    // Check if attendance already exists for this date and class
    const existingAttendance = await Attendance.findOne({
      date: new Date(date),
      classId,
      section,
      tenantId: req.user.tenantId
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        error: 'Attendance already marked for this date and class'
      });
    }

    // Calculate statistics
    const totalStudents = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const halfDayCount = records.filter(r => r.status === 'half_day').length;

    const attendance = await Attendance.create({
      date: new Date(date),
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      classId,
      section,
      records,
      markedBy: req.user.id,
      academicSession: req.body.academicSession,
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      halfDayCount
    });

    res.status(201).json({
      success: true,
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

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private (Teacher, School Admin)
exports.updateAttendance = async (req, res) => {
  try {
    let attendance = await Attendance.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance not found'
      });
    }

    // Check tenant access
    if (attendance.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this attendance'
      });
    }

    const { records } = req.body;

    // Recalculate statistics
    const totalStudents = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const halfDayCount = records.filter(r => r.status === 'half_day').length;

    attendance.records = records;
    attendance.totalStudents = totalStudents;
    attendance.presentCount = presentCount;
    attendance.absentCount = absentCount;
    attendance.lateCount = lateCount;
    attendance.halfDayCount = halfDayCount;
    attendance.markedBy = req.user.id;

    await attendance.save();

    res.status(200).json({
      success: true,
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

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = async (req, res) => {
  try {
    const { date, classId, section, studentId, startDate, endDate } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId };

    if (date) filter.date = new Date(date);
    if (classId) filter.classId = classId;
    if (section) filter.section = section;
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const { page, limit, skip } = req.pagination;
    const total = await Attendance.countDocuments(filter);
    const attendance = await Attendance.find(filter)
      .populate('classId', 'name sections')
      .populate('records.studentId', 'admissionNo personalInfo')
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(buildPaginationResponse(attendance, total, page, limit));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single attendance record
// @route   GET /api/attendance/:id
// @access  Private
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId })
      .populate('classId', 'name sections')
      .populate('records.studentId', 'admissionNo personalInfo.firstName personalInfo.lastName')
      .populate('markedBy', 'name');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance not found'
      });
    }

    // Check tenant access
    if (attendance.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this attendance'
      });
    }

    res.status(200).json({
      success: true,
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

// @desc    Get student attendance history
// @route   GET /api/attendance/student/:studentId
// @access  Private
exports.getStudentAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const studentId = req.params.studentId;

    if (req.user.role === 'parent') {
      if (studentId !== req.user.studentId.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to access this student attendance' });
      }
    }

    const filter = { tenantId: req.user.tenantId, 'records.studentId': studentId };

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendance = await Attendance.find(filter)
      .populate('classId', 'name')
      .sort({ date: -1 });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.reduce((acc, att) => {
      const record = att.records.find(r => r.studentId.toString() === studentId);
      return acc + (record && (record.status === 'present' || record.status === 'late') ? 1 : 0);
    }, 0);
    const absentDays = attendance.reduce((acc, att) => {
      const record = att.records.find(r => r.studentId.toString() === studentId);
      return acc + (record && record.status === 'absent' ? 1 : 0);
    }, 0);
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      statistics: {
        totalDays,
        presentDays,
        absentDays,
        percentage: parseFloat(percentage)
      },
      attendance: attendance.map((entry) => {
        const record = entry.records.find((item) => item.studentId.toString() === studentId);
        return {
          _id: entry._id,
          date: entry.date,
          status: record?.status || 'not_marked',
          remarks: record?.remarks
        };
      })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get attendance report for a class
// @route   GET /api/attendance/report/:classId
// @access  Private
exports.getClassAttendanceReport = async (req, res) => {
  try {
    const { section, startDate, endDate } = req.query;
    const classId = req.params.classId;
    const filter = {
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      classId
    };

    if (section) filter.section = section;
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendance = await Attendance.find(filter)
      .populate('records.studentId', 'admissionNo personalInfo.firstName personalInfo.lastName')
      .sort({ date: -1 });

    // Get all students in the class
    const students = await Student.find({
      classId,
      section,
      tenantId: req.user.tenantId,
      isActive: true
    });

    // Build report
    const report = students.map(student => {
      const studentAttendance = attendance.map(att => {
        const record = att.records.find(r => r.studentId.toString() === student._id.toString());
        return {
          date: att.date,
          status: record ? record.status : 'not_marked'
        };
      });

      const totalDays = attendance.length;
      const presentDays = studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const absentDays = studentAttendance.filter(a => a.status === 'absent').length;
      const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

      return {
        student: {
          id: student._id,
          admissionNo: student.admissionNo,
          name: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`
        },
        statistics: {
          totalDays,
          presentDays,
          absentDays,
          percentage: parseFloat(percentage)
        },
        attendance: studentAttendance
      };
    });

    res.status(200).json({
      success: true,
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

// @desc    Delete attendance
// @route   DELETE /api/attendance/:id
// @access  Private (School Admin only)
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        error: 'Attendance not found'
      });
    }

    // Check tenant access
    if (attendance.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this attendance'
      });
    }

    await attendance.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Attendance deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Teacher marks own attendance
// @route   POST /api/attendance/self
// @access  Private (Teacher)
exports.markSelfAttendance = async (req, res) => {
  try {
    const { date, status, remarks } = req.body;
    const attDate = new Date(date || Date.now());
    attDate.setHours(0, 0, 0, 0);

    const teacher = await Teacher.findOne({ userId: req.user._id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher profile not found' });
    }

    const existing = await TeacherAttendance.findOne({
      date: attDate,
      teacherId: teacher._id,
      tenantId: req.user.tenantId
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Attendance already marked for today. Use update to change.' });
    }

    const attendance = await TeacherAttendance.create({
      date: attDate,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      teacherId: teacher._id,
      userId: req.user._id,
      status,
      remarks,
      markedBy: req.user._id
    });

    res.status(201).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get teacher's own attendance
// @route   GET /api/attendance/self
// @access  Private (Teacher)
exports.getSelfAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const teacher = await Teacher.findOne({ userId: req.user._id, tenantId: req.user.tenantId, schoolId: req.user.schoolId });
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher profile not found' });
    }

    const filter = {
      teacherId: teacher._id,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId
    };

    const targetYear = year ? Number(year) : new Date().getFullYear();
    const targetMonth = month ? Number(month) - 1 : new Date().getMonth();
    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    filter.date = { $gte: start, $lte: end };

    const records = await TeacherAttendance.find(filter).sort({ date: 1 });

    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const halfDays = records.filter(r => r.status === 'half_day').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const percentage = totalDays > 0 ? (((presentDays + halfDays * 0.5) / totalDays) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      statistics: { totalDays, presentDays, absentDays, halfDays, percentage: parseFloat(percentage) },
      data: records
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all teacher attendance (admin view)
// @route   GET /api/attendance/teachers
// @access  Private (School Admin)
exports.getAllTeacherAttendance = async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId };

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      filter.date = d;
    } else if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const records = await TeacherAttendance.find(filter)
      .populate('teacherId', 'personalInfo employeeId')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get student attendance with holiday exclusion
// @route   GET /api/attendance/student/:studentId/summary
// @access  Private
exports.getStudentAttendanceSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const studentId = req.params.studentId;

    if (req.user.role === 'parent') {
      if (studentId !== req.user.studentId.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }
    }

    const targetYear = year ? Number(year) : new Date().getFullYear();
    const targetMonth = month ? Number(month) - 1 : new Date().getMonth();
    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    // Get holidays in the month
    const holidays = await CalendarEvent.find({
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      type: 'holiday',
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    const holidayDates = new Set();
    holidays.forEach(h => {
      const hStart = new Date(h.startDate);
      const hEnd = new Date(h.endDate);
      for (let d = new Date(hStart); d <= hEnd; d.setDate(d.getDate() + 1)) {
        if (d >= start && d <= end) {
          holidayDates.add(new Date(d).setHours(0, 0, 0, 0));
        }
      }
    });

    const attendance = await Attendance.find({
      tenantId: req.user.tenantId,
      'records.studentId': studentId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // Calculate working days excluding holidays and weekends
    const workingDays = [];
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(targetYear, targetMonth, i);
      d.setHours(0, 0, 0, 0);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(d.getTime())) {
        workingDays.push(d);
      }
    }

    const totalWorkingDays = workingDays.length;
    let presentDays = 0;
    let absentDays = 0;
    let markedDays = 0;

    const calendar = workingDays.map(wd => {
      const att = attendance.find(a => {
        const aDate = new Date(a.date);
        aDate.setHours(0, 0, 0, 0);
        return aDate.getTime() === wd.getTime();
      });
      const record = att?.records.find(r => r.studentId.toString() === studentId);
      if (record) {
        markedDays++;
        if (record.status === 'present' || record.status === 'late') presentDays++;
        else if (record.status === 'absent') absentDays++;
      }
      return {
        date: wd,
        status: record?.status || 'not_marked',
        isHoliday: false
      };
    });

    // Add holidays to calendar
    const holidayEntries = Array.from(holidayDates).map(ts => ({
      date: new Date(ts),
      status: 'holiday',
      isHoliday: true
    }));

    const fullCalendar = [...calendar, ...holidayEntries].sort((a, b) => a.date - b.date);
    const percentage = totalWorkingDays > 0 ? ((presentDays / totalWorkingDays) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      statistics: {
        totalWorkingDays,
        markedDays,
        presentDays,
        absentDays,
        holidays: holidayDates.size,
        percentage: parseFloat(percentage)
      },
      calendar: fullCalendar
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
