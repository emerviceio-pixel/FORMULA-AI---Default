const express = require('express');
const router = express.Router();
const { exportFeedback, getExportStats } = require('../controllers/adminFeedbackController');
const { requireAdminAuth } = require('../middleware/auth');

// Export feedback data (requires admin authentication)
router.get('/export', requireAdminAuth, exportFeedback);
router.get('/export-stats', requireAdminAuth, getExportStats);

module.exports = router;