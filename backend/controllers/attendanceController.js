const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
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
    let attendance = await Attendance.findById(req.params.id);

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
    const attendance = await Attendance.findById(req.params.id)
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
    const attendance = await Attendance.findById(req.params.id);

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

    await attendance.remove();

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
