const Homework = require('../models/Homework');
const Class = require('../models/Class');
const Student = require('../models/Student');

const tenantFilter = (req) => ({ tenantId: req.user.tenantId, schoolId: req.user.schoolId });

exports.createHomework = async (req, res) => {
  try {
    const { classId, section, subject, title, description, dueDate, attachment } = req.body;

    const cls = await Class.findOne({ _id: classId, ...tenantFilter(req), isActive: true });
    if (!cls) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }

    const homework = await Homework.create({
      ...tenantFilter(req),
      classId,
      section,
      subject,
      title,
      description,
      dueDate: new Date(dueDate),
      attachment,
      assignedBy: req.user._id,
      academicSession: req.body.academicSession
    });

    res.status(201).json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHomework = async (req, res) => {
  try {
    const { classId, section, subject, search } = req.query;
    const filter = { ...tenantFilter(req), isActive: true };

    if (classId) filter.classId = classId;
    if (section) filter.section = section;
    if (subject) filter.subject = subject;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user.role === 'parent') {
      const student = await Student.findOne({ _id: req.user.studentId, ...tenantFilter(req), isActive: true });
      if (!student) {
        return res.status(403).json({ success: false, error: 'Student not found' });
      }
      filter.classId = student.classId;
      filter.section = student.section;
    }

    if (req.user.role === 'teacher') {
      const teacher = await require('../models/Teacher').findOne({ userId: req.user._id, ...tenantFilter(req) });
      if (teacher && teacher.classes && teacher.classes.length > 0) {
        const teacherClassIds = teacher.classes.map(c => c.classId);
        filter.classId = { $in: teacherClassIds };
      }
    }

    const homework = await Homework.find(filter)
      .populate('classId', 'name')
      .populate('assignedBy', 'name')
      .sort({ dueDate: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: homework.length, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHomeworkById = async (req, res) => {
  try {
    const homework = await Homework.findOne({ _id: req.params.id, ...tenantFilter(req) })
      .populate('classId', 'name')
      .populate('assignedBy', 'name');

    if (!homework) {
      return res.status(404).json({ success: false, error: 'Homework not found' });
    }

    if (req.user.role === 'parent') {
      const student = await Student.findOne({ _id: req.user.studentId, ...tenantFilter(req), isActive: true });
      if (!student || student.classId.toString() !== homework.classId._id.toString() || student.section !== homework.section) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this homework' });
      }
    }

    res.status(200).json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateHomework = async (req, res) => {
  try {
    const { classId, section, subject, title, description, dueDate, attachment } = req.body;

    const homework = await Homework.findOne({ _id: req.params.id, ...tenantFilter(req) });
    if (!homework) {
      return res.status(404).json({ success: false, error: 'Homework not found' });
    }

    if (req.user.role === 'teacher' && homework.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'You can only edit your own homework' });
    }

    const updated = await Homework.findOneAndUpdate(
      { _id: req.params.id, ...tenantFilter(req) },
      { classId, section, subject, title, description, dueDate: dueDate ? new Date(dueDate) : undefined, attachment },
      { new: true, runValidators: true }
    ).populate('classId', 'name').populate('assignedBy', 'name');

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteHomework = async (req, res) => {
  try {
    const homework = await Homework.findOne({ _id: req.params.id, ...tenantFilter(req) });
    if (!homework) {
      return res.status(404).json({ success: false, error: 'Homework not found' });
    }

    if (req.user.role === 'teacher' && homework.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'You can only delete your own homework' });
    }

    await Homework.findOneAndUpdate({ _id: req.params.id }, { isActive: false });
    res.status(200).json({ success: true, message: 'Homework deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
