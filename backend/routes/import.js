const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const importController = require('../controllers/importController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect, requireActiveLicense);

router.get('/students/template', importController.downloadStudentTemplate);
router.get('/teachers/template', importController.downloadTeacherTemplate);

router.post('/students',
  authorize('school_admin', 'super_admin'),
  requireFeature('STUDENTS'),
  requireWriteAccess,
  upload.single('file'),
  importController.bulkImportStudents
);

router.post('/teachers',
  authorize('school_admin', 'super_admin'),
  requireFeature('TEACHERS'),
  requireWriteAccess,
  upload.single('file'),
  importController.bulkImportTeachers
);

module.exports = router;
