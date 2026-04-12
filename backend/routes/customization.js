const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  updateTheme,
  updateTemplate,
  uploadLogo,
  updateModules,
  addCustomField,
  removeCustomField,
  updateSettings,
  getCustomization
} = require('../controllers/customizationController');

router.get('/', protect, getCustomization);
router.put('/theme', protect, authorize('school_admin'), updateTheme);
router.put('/template', protect, authorize('school_admin'), updateTemplate);
router.post('/logo', protect, authorize('school_admin'), uploadLogo);
router.put('/modules', protect, authorize('school_admin'), updateModules);
router.post('/custom-fields', protect, authorize('school_admin'), addCustomField);
router.delete('/custom-fields/:fieldId', protect, authorize('school_admin'), removeCustomField);
router.put('/settings', protect, authorize('school_admin'), updateSettings);

module.exports = router;
