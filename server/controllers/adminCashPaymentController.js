// server/controllers/adminCashPaymentController.js
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const AuditLog = require('../models/AuditLog');

const adminCashPaymentController = {
  async createCashSubscription(req, res) {
    try {
      const { userId, plan, amount, currency = 'GHS', notes } = req.body;
      
      // SECURITY: Dual approval for large amounts
      const DUAL_APPROVAL_THRESHOLD = 1000; // GHS
      const RECEIPT_REQUIRED_THRESHOLD = 500; // GHS
      
      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      // Check if user already has active premium
      if (user.subscription === 'premium' && user.subscriptionEndDate > new Date()) {
        return res.status(400).json({
          success: false,
          error: 'User already has active premium subscription'
        });
      }

      // Validate amount matches plan
      const expectedAmount = plan === 'monthly' ? 49.90 : 499.00;
      if (Math.abs(amount - expectedAmount) > 0.01) {
        return res.status(400).json({
          success: false,
          error: `Amount should be GHS ${expectedAmount} for ${plan} plan`
        });
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      
      if (plan === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // SECURITY: Generate unique reference
      const paymentReference = `CASH-${Date.now()}-${userId.slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Determine initial status
      let status = 'active';

      // Create subscription
      const subscription = new Subscription({
        userId,
        plan,
        status: 'active',
        paymentMethod: 'cash',
        startDate,
        endDate,
        paymentAmount: amount,
        paymentCurrency: currency,
        paymentDate: new Date(),
        paymentReference,
        adminApprovedBy: req.user._id,
        adminNotes: notes,
        // SECURITY: Add metadata
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      await subscription.save();

      // Only activate user immediately if under threshold
      if (amount <= DUAL_APPROVAL_THRESHOLD) {
        user.subscription = 'premium';
        user.subscriptionEndDate = endDate;
        await user.save();
      }

      // SECURITY: Create audit log
      await AuditLog.create({
        adminId: req.user._id,
        action: 'cash_payment',
        targetUserId: userId,
        targetSubscriptionId: subscription._id,
        details: {
          plan,
          amount,
          currency,
          notes,
          status,
          requiresReceipt: amount > RECEIPT_REQUIRED_THRESHOLD
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: {
          subscription,
          message: amount > DUAL_APPROVAL_THRESHOLD 
            ? 'Payment recorded. Requires secondary approval.'
            : 'Cash payment recorded successfully',
          requiresReceipt: amount > RECEIPT_REQUIRED_THRESHOLD
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process cash payment' 
      });
    }
  },

  async getPendingCashPayments(req, res) {
    try {
      const pendingPayments = await Subscription.find({
        paymentMethod: 'cash',
        status: { $in: ['pending_approval', 'pending_dual_approval'] }
      })
      .populate('userId', 'email nickname phone country subscription')
      .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: pendingPayments
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch pending payments' 
      });
    }
  },

  async verifyCashPayment(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { verificationNotes } = req.body;

      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ 
          success: false, 
          error: 'Subscription not found' 
        });
      }

      subscription.status = 'active';
      subscription.verifiedAt = new Date();
      subscription.verifiedBy = req.user._id;
      subscription.adminNotes = verificationNotes;
      
      await subscription.save();

      // Activate user's premium
      await User.findByIdAndUpdate(subscription.userId, {
        subscription: 'premium',
        subscriptionEndDate: subscription.endDate
      });

      // Create audit log
      await AuditLog.create({
        adminId: req.user._id,
        action: 'cash_payment_verification',
        targetUserId: subscription.userId,
        targetSubscriptionId: subscription._id,
        details: { verificationNotes },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Cash payment verified successfully'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to verify payment' 
      });
    }
  },

  // Add secondary approval endpoint
  async approveLargeCashPayment(req, res) {
    try {
      const { subscriptionId } = req.params;
      const { approvalNotes } = req.body;

      // Check if approver is different from creator
      const subscription = await Subscription.findById(subscriptionId);
      
      if (subscription.adminApprovedBy.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          error: 'Secondary approval must be done by a different admin'
        });
      }

      subscription.status = 'active';
      subscription.secondaryApprovedBy = req.user._id;
      subscription.secondaryApprovedAt = new Date();
      subscription.adminNotes += ` | Secondary approval: ${approvalNotes}`;
      await subscription.save();

      // Activate user
      await User.findByIdAndUpdate(subscription.userId, {
        subscription: 'premium',
        subscriptionEndDate: subscription.endDate
      });

      // Audit log for secondary approval
      await AuditLog.create({
        adminId: req.user._id,
        action: 'cash_payment_approval',
        targetSubscriptionId: subscriptionId,
        details: { approvalNotes },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Payment approved successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve payment' });
    }
  }
};

module.exports = adminCashPaymentController;