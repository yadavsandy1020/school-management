const AuditLog = require('../models/AuditLog');

// @desc    Get audit logs with filters and pagination
// @route   GET /api/audit-logs
// @access  Private (Admin)
exports.getAuditLogs = async (req, res) => {
  try {
    const { userId, module, action, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (req.user.role !== 'super_admin') {
      filter.tenantId = req.user.tenantId;
      filter.schoolId = req.user.schoolId;
    }
    if (userId) filter.userId = userId;
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
