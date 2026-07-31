const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requireActiveLicense, requireFeature } = require('../middleware/saas');
const homeworkController = require('../controllers/homeworkController');

router.use(protect, requireActiveLicense, requireFeature('ACADEMICS'));

router.get('/', homeworkController.getHomework);
router.get('/:id', homeworkController.getHomeworkById);
router.post('/', authorize('super_admin', 'school_admin', 'teacher'), homeworkController.createHomework);
router.put('/:id', authorize('super_admin', 'school_admin', 'teacher'), homeworkController.updateHomework);
router.delete('/:id', authorize('super_admin', 'school_admin', 'teacher'), homeworkController.deleteHomework);

module.exports = router;
