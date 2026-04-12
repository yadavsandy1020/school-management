const Notice = require('../models/Notice');
const { buildPaginationResponse } = require('../middleware/pagination');

// @desc    Create notice
// @route   POST /api/notices
// @access  Private (School Admin, Teacher)
exports.createNotice = async (req, res) => {
  try {
    const { title, content, category, priority, targetType, targetClasses, targetSections, expiryDate, attachments } = req.body;

    const notice = await Notice.create({
      title,
      content,
      tenantId: req.user.tenantId,
      schoolId: req.user.schoolId,
      category,
      priority,
      targetType,
      targetClasses,
      targetSections,
      publishedBy: req.user.id,
      expiryDate,
      attachments
    });

    res.status(201).json({
      success: true,
      notice
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all notices
// @route   GET /api/notices
// @access  Private
exports.getNotices = async (req, res) => {
  try {
    const { category, targetType, active } = req.query;
    const filter = { 
      tenantId: req.user.tenantId, 
      schoolId: req.user.schoolId,
      isActive: true 
    };

    if (category) filter.category = category;
    if (targetType) filter.targetType = targetType;
    if (active === 'false') filter.expiryDate = { $gte: new Date() };

    const { page, limit, skip } = req.pagination;
    const total = await Notice.countDocuments(filter);
    const notices = await Notice.find(filter)
      .populate('publishedBy', 'name role')
      .populate('targetClasses', 'name')
      .sort({ isPinned: -1, publishDate: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(buildPaginationResponse(notices, total, page, limit));
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single notice
// @route   GET /api/notices/:id
// @access  Private
exports.getNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('publishedBy', 'name role')
      .populate('targetClasses', 'name sections');

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }

    // Check tenant access
    if (notice.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this notice'
      });
    }

    // Increment view count
    notice.views += 1;
    await notice.save();

    res.status(200).json({
      success: true,
      notice
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update notice
// @route   PUT /api/notices/:id
// @access  Private (School Admin, Publisher)
exports.updateNotice = async (req, res) => {
  try {
    let notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }

    // Check tenant access
    if (notice.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this notice'
      });
    }

    // Only publisher or school admin can update
    if (req.user.role !== 'school_admin' && notice.publishedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this notice'
      });
    }

    const { title, content, category, priority, targetType, targetClasses, targetSections, expiryDate, attachments, isPinned } = req.body;

    notice = await Notice.findByIdAndUpdate(
      req.params.id,
      { title, content, category, priority, targetType, targetClasses, targetSections, expiryDate, attachments, isPinned },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      notice
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private (School Admin, Publisher)
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }

    // Check tenant access
    if (notice.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this notice'
      });
    }

    // Only publisher or school admin can delete
    if (req.user.role !== 'school_admin' && notice.publishedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this notice'
      });
    }

    await notice.remove();

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Pin/Unpin notice
// @route   PUT /api/notices/:id/pin
// @access  Private (School Admin)
exports.togglePinNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }

    // Check tenant access
    if (notice.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this notice'
      });
    }

    notice.isPinned = !notice.isPinned;
    await notice.save();

    res.status(200).json({
      success: true,
      notice
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get notices for specific user role
// @route   GET /api/notices/my-notices
// @access  Private
exports.getMyNotices = async (req, res) => {
  try {
    const filter = { 
      tenantId: req.user.tenantId, 
      schoolId: req.user.schoolId,
      isActive: true,
      $or: [
        { targetType: 'all' },
        { targetType: req.user.role }
      ]
    };

    // If student or teacher, check if notice is for their class
    if (req.user.role === 'student' && req.user.studentDetails?.classId) {
      filter.$or.push({ 
        targetType: 'specific_class',
        targetClasses: req.user.studentDetails.classId 
      });
    }

    if (req.user.role === 'teacher') {
      const Teacher = require('../models/Teacher');
      const teacher = await Teacher.findOne({ userId: req.user._id });
      if (teacher) {
        const classIds = teacher.classes.map(c => c.classId);
        filter.$or.push({ 
          targetType: 'specific_class',
          targetClasses: { $in: classIds }
        });
      }
    }

    const notices = await Notice.find(filter)
      .populate('publishedBy', 'name')
      .populate('targetClasses', 'name')
      .sort({ isPinned: -1, publishDate: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      count: notices.length,
      notices
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
