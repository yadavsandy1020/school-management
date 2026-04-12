const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');

// @desc    Create timetable
// @route   POST /api/timetable
// @access  Private (School Admin)
exports.createTimetable = async (req, res) => {
  try {
    const { classId, section, day, periods, academicSession } = req.body;

    // Check if timetable already exists
    const existingTimetable = await Timetable.findOne({
      classId,
      section,
      day,
      academicSession
    });

    if (existingTimetable) {
      return res.status(400).json({
        success: false,
        error: 'Timetable already exists for this class, section, and day'
      });
    }

    const timetable = await Timetable.create({
      classId,
      section,
      day,
      periods,
      academicSession,
      tenantId: req.user.tenantId
    });

    res.status(201).json({
      success: true,
      timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get timetables
// @route   GET /api/timetable
// @access  Private
exports.getTimetables = async (req, res) => {
  try {
    const { classId, section, day, academicSession } = req.query;

    const filter = { tenantId: req.user.tenantId };

    if (classId) filter.classId = classId;
    if (section) filter.section = section;
    if (day) filter.day = day;
    if (academicSession) filter.academicSession = academicSession;

    const timetables = await Timetable.find(filter)
      .populate('classId', 'name')
      .populate('periods.subjectId', 'name')
      .populate('periods.teacherId', 'personalInfo.firstName personalInfo.lastName')
      .sort({ day: 1 });

    res.status(200).json({
      success: true,
      data: timetables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single timetable
// @route   GET /api/timetable/:id
// @access  Private
exports.getTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('classId', 'name')
      .populate('periods.subjectId', 'name')
      .populate('periods.teacherId', 'personalInfo.firstName personalInfo.lastName');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        error: 'Timetable not found'
      });
    }

    // Check tenant access
    if (timetable.tenantId !== req.user.tenantId && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update timetable
// @route   PUT /api/timetable/:id
// @access  Private (School Admin)
exports.updateTimetable = async (req, res) => {
  try {
    let timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        error: 'Timetable not found'
      });
    }

    // Check tenant access
    if (timetable.tenantId !== req.user.tenantId && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      timetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete timetable
// @route   DELETE /api/timetable/:id
// @access  Private (School Admin)
exports.deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        error: 'Timetable not found'
      });
    }

    // Check tenant access
    if (timetable.tenantId !== req.user.tenantId && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    await timetable.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Timetable deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get class timetable (full week)
// @route   GET /api/timetable/class/:classId/:section
// @access  Private
exports.getClassTimetable = async (req, res) => {
  try {
    const { classId, section } = req.params;
    const { academicSession } = req.query;

    const filter = {
      classId,
      section,
      tenantId: req.user.tenantId
    };

    if (academicSession) filter.academicSession = academicSession;

    const timetables = await Timetable.find(filter)
      .populate('classId', 'name')
      .populate('periods.subjectId', 'name')
      .populate('periods.teacherId', 'personalInfo.firstName personalInfo.lastName')
      .sort({ day: 1 });

    // Group by day
    const groupedTimetable = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    days.forEach(day => {
      groupedTimetable[day] = timetables.find(t => t.day === day) || null;
    });

    res.status(200).json({
      success: true,
      timetable: groupedTimetable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
