const express = require('express');
const router = express.Router();
const { protect, authorize, requirePermission } = require('../middleware/auth');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const documentController = require('../controllers/documentController');

router.use(protect, requireActiveLicense, requireFeature('DOCUMENT_GENERATOR'));

// Certificate types & variables (metadata)
router.get('/certificate-types', documentController.getCertificateTypes);
router.get('/variables', documentController.getVariables);

// Templates CRUD
router.get('/templates', requirePermission('DOCUMENTS_VIEW'), documentController.getTemplates);
router.get('/templates/:id', requirePermission('DOCUMENTS_VIEW'), documentController.getTemplate);
router.post('/templates', authorize('super_admin', 'school_admin'), requirePermission('DOCUMENTS_TEMPLATE_MANAGE'), requireWriteAccess, documentController.createTemplate);
router.put('/templates/:id', authorize('super_admin', 'school_admin'), requirePermission('DOCUMENTS_TEMPLATE_MANAGE'), requireWriteAccess, documentController.updateTemplate);
router.delete('/templates/:id', authorize('super_admin', 'school_admin'), requirePermission('DOCUMENTS_TEMPLATE_MANAGE'), requireWriteAccess, documentController.deleteTemplate);
router.post('/templates/seed', authorize('super_admin', 'school_admin'), requirePermission('DOCUMENTS_TEMPLATE_MANAGE'), requireWriteAccess, documentController.seedTemplates);

// Document generation
router.post('/generate', authorize('super_admin', 'school_admin', 'teacher'), requirePermission('DOCUMENTS_GENERATE'), requireWriteAccess, documentController.generateDocument);
router.post('/preview', requirePermission('DOCUMENTS_VIEW'), documentController.previewDocument);
router.post('/bulk-generate', authorize('super_admin', 'school_admin'), requirePermission('DOCUMENTS_GENERATE'), requireWriteAccess, documentController.bulkGenerate);

// New engine endpoints
router.post('/report', authorize('super_admin', 'school_admin', 'teacher'), requirePermission('DOCUMENTS_GENERATE'), requireWriteAccess, documentController.generateReport);
router.post('/notice', authorize('super_admin', 'school_admin', 'teacher'), requirePermission('DOCUMENTS_GENERATE'), requireWriteAccess, documentController.generateNotice);
router.post('/salary-slip', authorize('super_admin', 'school_admin'), requirePermission('DOCUMENTS_GENERATE'), requireWriteAccess, documentController.generateSalarySlipDoc);

// Document settings
router.get('/settings', requirePermission('DOCUMENTS_VIEW'), documentController.getDocumentSettings);
router.put('/settings', authorize('school_admin', 'super_admin'), requirePermission('DOCUMENTS_TEMPLATE_MANAGE'), requireWriteAccess, documentController.updateDocumentSettings);

// Generated documents history
router.get('/', requirePermission('DOCUMENTS_VIEW'), documentController.getDocuments);
router.get('/:id', requirePermission('DOCUMENTS_VIEW'), documentController.getDocument);
router.get('/:id/regenerate', requirePermission('DOCUMENTS_VIEW'), documentController.regeneratePdf);
router.put('/:id/void', authorize('super_admin', 'school_admin'), requirePermission('DOCUMENTS_VOID'), requireWriteAccess, documentController.voidDocument);

// Student documents
router.get('/student/:studentId', requirePermission('DOCUMENTS_VIEW'), documentController.getStudentDocuments);

module.exports = router;
