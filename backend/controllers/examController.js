const Exam = require('../models/Exam');
const ExamType = require('../models/ExamType');
const MarksEntry = require('../models/MarksEntry');
const GradeSystem = require('../models/GradeSystem');
const Student = require('../models/Student');
const User = require('../models/User');
const { getNextNumber } = require('../services/sequenceService');

const getGradeForPercentage = (percentage, gradeSystem) => {
  if (!gradeSystem || !gradeSystem.grades) return null;
  const grade = gradeSystem.grades.find(g => percentage >= g.minPercentage && percentage <= g.maxPercentage);
  return grade ? grade.grade : null;
};

exports.getExamTypes = async (req, res) => {
  try {
    const types = await ExamType.find({ tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createExamType = async (req, res) => {
  try {
    const type = await ExamType.create({ ...req.body, tenantId: req.user.tenantId, schoolId: req.user.schoolId, createdBy: req.user._id });
    res.status(201).json({ success: true, data: type });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getExams = async (req, res) => {
  try {
    const { examType, academicSessionId } = req.query;
    const filter = { tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true };
    if (examType) filter.examType = examType;
    if (academicSessionId) filter.academicSessionId = academicSessionId;

    const exams = await Exam.find(filter)
      .populate('examType', 'name code')
      .populate('subjects.subjectId', 'name code')
      .populate('subjects.classId', 'name sections')
      .sort({ startDate: -1 });

    res.status(200).json({ success: true, count: exams.length, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId })
      .populate('examType', 'name code')
      .populate('subjects.subjectId', 'name code')
      .populate('subjects.classId', 'name sections');
    if (!exam) return res.status(404).json({ success: false, error: 'Exam not found' });
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createExam = async (req, res) => {
  try {
    const data = { ...req.body, tenantId: req.user.tenantId, schoolId: req.user.schoolId, createdBy: req.user._id };
    if (!data.examNumber) {
      data.examNumber = await getNextNumber({
        tenantId: req.user.tenantId,
        schoolId: req.user.schoolId,
        entityType: 'exam',
        academicSession: data.academicSession || new Date().getFullYear().toString()
      });
    }
    const exam = await Exam.create(data);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId },
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    await Exam.findOneAndUpdate({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId }, { isActive: false, updatedBy: req.user._id });
    res.status(200).json({ success: true, message: 'Exam deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStudentsForMarks = async (req, res) => {
  try {
    const { classId, section } = req.query;
    const filter = { 'studentDetails.classId': classId, role: 'student', tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true };
    if (section) filter['studentDetails.section'] = section;

    const students = await User.find(filter)
      .select('name admissionNo studentDetails')
      .sort({ name: 1 });

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMarks = async (req, res) => {
  try {
    const { examId, classId, section, subjectId } = req.query;
    const filter = { examId, tenantId: req.user.tenantId, schoolId: req.user.schoolId };
    if (classId) filter.classId = classId;
    if (section) filter.section = section;
    if (subjectId) filter.subjectId = subjectId;

    const marks = await MarksEntry.find(filter)
      .populate('studentId', 'name studentDetails.admissionNo')
      .populate('subjectId', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: marks.length, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.saveMarks = async (req, res) => {
  try {
    const { marks } = req.body;
    const gradeSystem = await GradeSystem.findOne({ tenantId: req.user.tenantId, schoolId: req.user.schoolId, isDefault: true, isActive: true });

    const savedMarks = [];
    for (const mark of marks) {
      const percentage = (mark.marksObtained / mark.maxMarks) * 100;
      const grade = getGradeForPercentage(percentage, gradeSystem);

      const entry = await MarksEntry.findOneAndUpdate(
        {
          examId: mark.examId,
          studentId: mark.studentId,
          subjectId: mark.subjectId,
          tenantId: req.user.tenantId,
          schoolId: req.user.schoolId
        },
        {
          ...mark,
          tenantId: req.user.tenantId,
          schoolId: req.user.schoolId,
          grade,
          updatedBy: req.user._id
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
      savedMarks.push(entry);
    }

    res.status(200).json({ success: true, count: savedMarks.length, data: savedMarks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.publishResults = async (req, res) => {
  try {
    const exam = await Exam.findOneAndUpdate({ _id: req.params.id, tenantId: req.user.tenantId, schoolId: req.user.schoolId }, { isResultPublished: true, updatedBy: req.user._id }, { new: true });
    res.status(200).json({ success: true, data: exam, message: 'Results published' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getResult = async (req, res) => {
  try {
    const { examId, studentId } = req.query;
    const marks = await MarksEntry.find({ examId, studentId, tenantId: req.user.tenantId, schoolId: req.user.schoolId }).populate('subjectId', 'name code maxMarks');

    const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
    const totalMax = marks.reduce((sum, m) => sum + m.maxMarks, 0);
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        marks,
        totalObtained,
        totalMax,
        percentage: percentage.toFixed(2),
        rank: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getResultRanks = async (req, res) => {
  try {
    const { examId } = req.query;
    const marksEntries = await MarksEntry.find({ examId, tenantId: req.user.tenantId, schoolId: req.user.schoolId });

    const studentTotals = {};
    for (const entry of marksEntries) {
      if (!studentTotals[entry.studentId]) studentTotals[entry.studentId] = { obtained: 0, max: 0 };
      studentTotals[entry.studentId].obtained += entry.marksObtained;
      studentTotals[entry.studentId].max += entry.maxMarks;
    }

    const ranks = Object.entries(studentTotals)
      .map(([studentId, totals]) => ({
        studentId,
        totalObtained: totals.obtained,
        totalMax: totals.max,
        percentage: totals.max > 0 ? ((totals.obtained / totals.max) * 100).toFixed(2) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    res.status(200).json({ success: true, count: ranks.length, data: ranks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getGradeSystems = async (req, res) => {
  try {
    const systems = await GradeSystem.find({ tenantId: req.user.tenantId, schoolId: req.user.schoolId, isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: systems });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createGradeSystem = async (req, res) => {
  try {
    const system = await GradeSystem.create({ ...req.body, tenantId: req.user.tenantId, schoolId: req.user.schoolId, createdBy: req.user._id });
    res.status(201).json({ success: true, data: system });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
