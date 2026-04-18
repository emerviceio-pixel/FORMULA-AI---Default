// server/routes/admin.js
const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/admin');
const router = express.Router();
const { cashPaymentLimiter } = require('../middleware/adminRateLimit');
const adminCashPaymentController = require('../controllers/adminCashPaymentController');

router.post('/cash-payment', 
  (req, res, next) => {
    next();
  },
  requireAdmin,
  (req, res, next) => {
    next();
  },
  cashPaymentLimiter, 
  adminCashPaymentController.createCashSubscription
);

router.get('/dashboard', requireAdmin, adminController.getDashboardOverview);
router.get('/users/search', requireAdmin, adminController.searchUsersByEmail);
router.get('/users', requireAdmin, adminController.getAllUsers);
router.get('/feedback/analytics', requireAdmin, adminController.getFeedbackAnalytics);
router.get('/feedback/list', requireAdmin, adminController.getFeedbackList);


router.get('/active-users', requireAdmin, adminController.getActiveUsersByRange);
router.get('/revenue/monthly', requireAdmin, adminController.getMonthlyRevenue);
router.get('/cash-payments/pending', requireAdmin, adminCashPaymentController.getPendingCashPayments);

router.put('/cash-payments/:subscriptionId/verify', requireAdmin, adminCashPaymentController.verifyCashPayment);

module.exports = router;