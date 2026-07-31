const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requireActiveLicense, requireWriteAccess, checkStorageLimit } = require('../middleware/saas');
const {
  updateTheme,
  updateTemplate,
  uploadLogo,
  updateModules,
  addCustomField,
  removeCustomField,
  updateSettings,
  getCustomization,
  updateBranding,
  uploadAsset,
  updateDocumentSettings,
  updateAutoNumbering,
  updateDocumentTemplates,
  previewDocument
} = require('../controllers/customizationController');

router.use(protect, requireActiveLicense);

router.get('/', getCustomization);
router.put('/theme', authorize('school_admin'), requireWriteAccess, updateTheme);
router.put('/template', authorize('school_admin'), requireWriteAccess, updateTemplate);
router.post('/logo', authorize('school_admin'), requireWriteAccess, checkStorageLimit(5), uploadLogo);
router.put('/modules', authorize('school_admin'), requireWriteAccess, updateModules);
router.post('/custom-fields', authorize('school_admin'), requireWriteAccess, addCustomField);
router.delete('/custom-fields/:fieldId', authorize('school_admin'), requireWriteAccess, removeCustomField);
router.put('/settings', authorize('school_admin'), requireWriteAccess, updateSettings);

router.put('/branding', authorize('school_admin'), requireWriteAccess, updateBranding);
router.post('/upload-asset', authorize('school_admin'), requireWriteAccess, checkStorageLimit(10), uploadAsset);
router.put('/document-settings', authorize('school_admin'), requireWriteAccess, updateDocumentSettings);
router.put('/auto-numbering', authorize('school_admin'), requireWriteAccess, updateAutoNumbering);
router.put('/document-templates', authorize('school_admin'), requireWriteAccess, updateDocumentTemplates);
router.post('/preview/:type', authorize('school_admin'), requireWriteAccess, previewDocument);

module.exports = router;
