const CommunicationService = require('../services/communicationService');
const User = require('../models/User');
const Student = require('../models/Student');
const Message = require('../models/Message');

const tenantFilter = (req) => ({ tenantId: req.user.tenantId, schoolId: req.user.schoolId });

exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, body, html } = req.body;
    const result = await CommunicationService.sendEmail({ to, subject, body, html });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.sendSMS = async (req, res) => {
  try {
    const { to, message } = req.body;
    const result = await CommunicationService.sendSMS({ to, message });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.sendBulk = async (req, res) => {
  try {
    const { audience, subject, body, html, sendEmail, sendSMS } = req.body;
    let recipients = [];

    if (audience.includes('all')) {
      const users = await User.find({ ...tenantFilter(req), isActive: true }).select('name email phone');
      recipients = users;
    } else {
      const users = await User.find({ ...tenantFilter(req), role: { $in: audience }, isActive: true }).select('name email phone');
      recipients = users;
    }

    const result = await CommunicationService.sendBulk({ recipients, subject, body, html, sendEmail, sendSMS });

    // Save message record
    await Message.create({
      ...tenantFilter(req),
      senderId: req.user._id,
      recipients: recipients.map(r => r._id),
      recipientRoles: audience,
      subject,
      body,
      category: 'announcement',
      createdBy: req.user._id
    });

    res.status(200).json({ success: true, count: recipients.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCommunicationLogs = async (req, res) => {
  try {
    const messages = await Message.find({ ...tenantFilter(req), isActive: true })
      .populate('senderId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getWhatsAppLink = async (req, res) => {
  try {
    const { phone, message } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    const link = CommunicationService.generateWhatsAppLink(phone, message || '');
    res.status(200).json({ success: true, data: { link } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getNoticesForParent = async (req, res) => {
  try {
    const Notice = require('../models/Notice');
    const Student = require('../models/Student');

    const student = await Student.findOne({ _id: req.user.studentId, ...tenantFilter(req), isActive: true });
    if (!student) {
      return res.status(403).json({ success: false, error: 'Student not found' });
    }

    const notices = await Notice.find({
      ...tenantFilter(req),
      isActive: true,
      $or: [
        { targetType: 'all' },
        { targetType: 'parents' },
        { targetType: 'specific_class', targetClasses: student.classId }
      ]
    })
      .populate('publishedBy', 'name')
      .sort({ isPinned: -1, publishDate: -1 });

    res.status(200).json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
