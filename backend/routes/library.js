const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireFeature, requireWriteAccess } = require('../middleware/saas');
const libraryController = require('../controllers/libraryController');

router.use(protect, requireActiveLicense, requireFeature('LIBRARY'));

router.get('/categories', requirePermission('LIBRARY_VIEW'), libraryController.getCategories);

router.get('/', requirePermission('LIBRARY_VIEW'), libraryController.getBooks);
router.get('/:id', requirePermission('LIBRARY_VIEW'), libraryController.getBook);
router.post('/', authorize('super_admin', 'school_admin', 'librarian'), requirePermission('LIBRARY_MANAGE'), requireWriteAccess, libraryController.createBook);
router.put('/:id', authorize('super_admin', 'school_admin', 'librarian'), requirePermission('LIBRARY_MANAGE'), requireWriteAccess, libraryController.updateBook);
router.delete('/:id', authorize('super_admin', 'school_admin', 'librarian'), requirePermission('LIBRARY_MANAGE'), requireWriteAccess, libraryController.deleteBook);

router.get('/issues/all', requirePermission('LIBRARY_VIEW'), libraryController.getIssues);
router.post('/issues', authorize('super_admin', 'school_admin', 'librarian'), requirePermission('LIBRARY_MANAGE'), requireWriteAccess, libraryController.issueBook);
router.put('/issues/:id/return', authorize('super_admin', 'school_admin', 'librarian'), requirePermission('LIBRARY_MANAGE'), requireWriteAccess, libraryController.returnBook);

module.exports = router;
