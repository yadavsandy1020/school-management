const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const examController = require('../controllers/examController');

router.use(protect, requireActiveLicense, requireFeature('EXAMINATIONS'));

router.get('/types', requirePermission('CLASS_VIEW'), examController.getExamTypes);
router.post('/types', authorize('super_admin', 'school_admin'), requirePermission('CLASS_MANAGE'), requireWriteAccess, examController.createExamType);

router.get('/grade-systems', requirePermission('CLASS_VIEW'), examController.getGradeSystems);
router.post('/grade-systems', authorize('super_admin', 'school_admin'), requirePermission('CLASS_MANAGE'), requireWriteAccess, examController.createGradeSystem);

router.get('/', requirePermission('CLASS_VIEW'), examController.getExams);
router.get('/:id', requirePermission('CLASS_VIEW'), examController.getExam);
router.post('/', authorize('super_admin', 'school_admin'), requirePermission('CLASS_MANAGE'), requireWriteAccess, examController.createExam);
router.put('/:id', authorize('super_admin', 'school_admin'), requirePermission('CLASS_MANAGE'), requireWriteAccess, examController.updateExam);
router.delete('/:id', authorize('super_admin', 'school_admin'), requirePermission('CLASS_MANAGE'), requireWriteAccess, examController.deleteExam);

router.get('/:id/students', requirePermission('ATTENDANCE_MARK'), examController.getStudentsForMarks);
router.get('/marks', requirePermission('CLASS_VIEW'), examController.getMarks);
router.post('/marks', authorize('super_admin', 'school_admin', 'teacher'), requirePermission('ATTENDANCE_MARK'), requireWriteAccess, examController.saveMarks);

router.post('/:id/publish', authorize('super_admin', 'school_admin'), requirePermission('CLASS_MANAGE'), requireWriteAccess, examController.publishResults);
router.get('/result/student', requirePermission('STUDENT_VIEW'), examController.getResult);
router.get('/result/ranks', requirePermission('CLASS_VIEW'), examController.getResultRanks);

module.exports = router;
