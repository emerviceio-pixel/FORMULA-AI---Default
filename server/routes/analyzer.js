// server/routes/analyzer.js
const express = require('express');
const router = express.Router();
const analyzerController = require('../controllers/analyzerController');
const { requireAuth } = require('../middleware/auth');
const { requireAPIToken } = require('../middleware/apiAuth');
const { authenticateUser } = require('../middleware/authenticateUser');

// Web users (session-based auth)
router.post('/validate-and-analyze', requireAuth, analyzerController.analyzeFood);
// Mobile users (token-based auth)  
router.post('/mobile/analyze', requireAPIToken, analyzerController.analyzeFood);

module.exports = router;
