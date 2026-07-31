const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { requireActiveLicense, requireFeature, checkAICredits } = require('../middleware/saas');
const aiController = require('../controllers/aiController');

router.use(protect, requireActiveLicense, requireFeature('AI'));

router.post('/summarize', requirePermission('DASHBOARD_VIEW'), checkAICredits(1), aiController.summarize);
router.post('/sentiment', requirePermission('DASHBOARD_VIEW'), checkAICredits(1), aiController.sentiment);
router.post('/replies', requirePermission('NOTICE_VIEW'), checkAICredits(1), aiController.suggestReplies);
router.post('/entities', requirePermission('DASHBOARD_VIEW'), checkAICredits(1), aiController.extractEntities);
router.get('/insights', requirePermission('DASHBOARD_VIEW'), checkAICredits(1), aiController.getDashboardInsights);

module.exports = router;
