const AcademicSession = require('../models/AcademicSession');
const School = require('../models/School');

const getScope = async (req) => {
  const tenantId = req.user.tenantId;
  let schoolId = req.user.schoolId || req.body?.schoolId;

  if (tenantId && !schoolId) {
    const school = await School.findOne({ tenantId, isActive: true }).select('_id');
    if (school) schoolId = school._id;
  }

  return { tenantId, schoolId };
};

const sessionScope = (req) => {
  if (req.user.role === 'super_admin') return {};
  return { tenantId: req.user.tenantId, schoolId: req.user.schoolId };
};

// @desc    Get all academic sessions for tenant/school
// @route   GET /api/academic-sessions
// @access  Private
exports.getSessions = async (req, res) => {
  try {
    const { current } = req.query;
    const filter = { ...sessionScope(req), isActive: true };
    if (current !== undefined) filter.isCurrent = current === 'true';

    const sessions = await AcademicSession.find(filter).sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single academic session
// @route   GET /api/academic-sessions/:id
// @access  Private
exports.getSession = async (req, res) => {
  try {
    const session = await AcademicSession.findOne({ _id: req.params.id, ...sessionScope(req) });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Academic session not found' });
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create academic session
// @route   POST /api/academic-sessions
// @access  Private
exports.createSession = async (req, res) => {
  try {
    const { name, code, startDate, endDate, financialYear, terms, isCurrent } = req.body;
    const { tenantId, schoolId } = await getScope(req);

    if (!schoolId) {
      return res.status(400).json({ success: false, error: 'School ID is required' });
    }

    if (isCurrent) {
      await AcademicSession.updateMany(
        { tenantId, schoolId },
        { isCurrent: false }
      );
    }

    const session = await AcademicSession.create({
      tenantId,
      schoolId,
      name,
      code,
      startDate,
      endDate,
      financialYear,
      terms,
      isCurrent: !!isCurrent,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update academic session
// @route   PUT /api/academic-sessions/:id
// @access  Private
exports.updateSession = async (req, res) => {
  try {
    const session = await AcademicSession.findOne({ _id: req.params.id, ...sessionScope(req) });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Academic session not found' });
    }

    if (req.body.isCurrent) {
      await AcademicSession.updateMany(
        { tenantId: session.tenantId, schoolId: session.schoolId },
        { isCurrent: false }
      );
    }

    const updates = { ...req.body, updatedBy: req.user._id };
    delete updates.tenantId;
    delete updates.schoolId;

    Object.assign(session, updates);
    await session.save();

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete academic session (soft)
// @route   DELETE /api/academic-sessions/:id
// @access  Private
exports.deleteSession = async (req, res) => {
  try {
    const session = await AcademicSession.findOne({ _id: req.params.id, ...sessionScope(req) });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Academic session not found' });
    }

    session.isActive = false;
    session.updatedBy = req.user._id;
    await session.save();

    res.status(200).json({ success: true, message: 'Academic session deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Set current academic session
// @route   POST /api/academic-sessions/:id/set-current
// @access  Private
exports.setCurrent = async (req, res) => {
  try {
    const session = await AcademicSession.findOne({ _id: req.params.id, ...sessionScope(req) });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Academic session not found' });
    }

    await AcademicSession.updateMany(
      { tenantId: session.tenantId, schoolId: session.schoolId },
      { isCurrent: false }
    );

    session.isCurrent = true;
    session.updatedBy = req.user._id;
    await session.save();

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
