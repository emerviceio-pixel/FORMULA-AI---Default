// server/controllers/subscriptionController.js
const User = require('../models/User');
const Subscription = require('../models/Subscription'); 
const paystackService = require('../services/paystackService');
const crypto = require('crypto');
const axios = require('axios');

const subscriptionController = {
  // Initialize payment (enhanced with revenue tracking preparation)
  async initializePayment(req, res) {
    try {
      const { userId } = req.session;
      const { plan, paymentMethod, mobileMoney, cardDetails } = req.body;

      // Validate plan
      if (!['premium'].includes(plan)) {
        return res.status(400).json({ success: false, error: 'Invalid plan' });
      }

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Payment amount (in kobo - Paystack uses smallest currency unit)
      const amount = 3999; // GHC39.99
      
      // Prepare payment data
      const paymentData = {
        email: user.email,
        amount: amount,
        currency: 'GHS', // Ghanaian Cedi
        callback_url: `${process.env.FRONTEND_URL}/subscription/success`,
        metadata: {
          userId: userId,
          plan: plan,
          paymentMethod: paymentMethod,
          ...(paymentMethod === 'mobile' && mobileMoney ? {
            mobileMoney: mobileMoney
          } : {}),
          ...(paymentMethod === 'card' && cardDetails ? {
            cardDetails: {
              name: cardDetails.name
            }
          } : {})
        }
      };

      // Initialize Paystack transaction
      const paystackResponse = await paystackService.initializeTransaction(paymentData);
      
      if (paystackResponse.status) {
        res.json({
          success: true,
          authorizationUrl: paystackResponse.data.authorization_url,
          reference: paystackResponse.data.reference
        });
      } else {
        throw new Error(paystackResponse.message);
      }
    } catch (error) {
      console.error('Initialize payment error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Payment initialization failed. Please try again.' 
      });
    }
  },

  // Handle payment webhook (enhanced to create Subscription records for revenue tracking)
  async handleWebhook(req, res) {
    try {
      // Verify webhook signature (security critical!)
      const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (hash !== req.headers['x-paystack-signature']) {
        return res.status(400).send('Invalid signature');
      }

      const event = req.body;
      
      // Handle successful one-time payments
      if (event.event === 'charge.success') {
        const { reference } = event.data;
        
        // Verify transaction with Paystack
        const verification = await paystackService.verifyTransaction(reference);
        
        if (verification.status && verification.data.status === 'success') {
          const metadata = verification.data.metadata;
          const userId = metadata.userId;
          const amountInGHS = verification.data.amount / 100; // Convert from kobo to GHS
          
          // Update user subscription
          await User.findByIdAndUpdate(userId, {
            subscription: 'premium',
            subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            'settings.paymentMethod': metadata.paymentMethod,
            'settings.lastPaymentReference': reference
          });
          
          // ✅ CREATE SUBSCRIPTION RECORD FOR REVENUE TRACKING
          await new Subscription({
          userId: userId,
          // Map 'premium' to 'monthly'
          plan: metadata.plan === 'premium' ? 'monthly' : (metadata.plan || 'monthly'),
          status: 'active',
          // Map payment methods to enum values
          paymentMethod: metadata.paymentMethod === 'card' ? 'paystack' 
                        : metadata.paymentMethod === 'mobile' ? 'mobile_money' 
                        : metadata.paymentMethod || 'paystack',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentAmount: amountInGHS,
          paymentCurrency: verification.data.currency || 'GHS',
          paymentDate: new Date(verification.data.paid_at),
          paymentReference: reference
        }).save();
          
        }
      }
      
      // Handle subscription cancellation (new)
      if (event.event === 'subscription.disable') {
        const subscriptionData = event.data.subscription;
        const customerCode = subscriptionData.customer;
        
        // Find user by customer code (you'll need to store this during initial subscription)
        const user = await User.findOne({ 'paystack.customerCode': customerCode });
        
        if (user) {
          // Keep premium until the end of current billing cycle
          const currentPeriodEnd = new Date(subscriptionData.next_payment_date);
          await User.findByIdAndUpdate(user._id, {
            subscriptionExpiry: currentPeriodEnd
          });
          
          console.log(`Cancellation scheduled for user ${user._id}. Premium until ${currentPeriodEnd}`);
        }
      }
      
      res.status(200).send('Webhook processed');
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).send('Webhook processing failed');
    }
  },

  // Verify payment manually (fallback - enhanced with revenue tracking)
  async verifyPayment(req, res) {
    try {
      const { reference } = req.query;
      
      if (!reference) {
        return res.status(400).json({ success: false, error: 'Reference required' });
      }

      const verification = await paystackService.verifyTransaction(reference);
      
      if (verification.status && verification.data.status === 'success') {
        const metadata = verification.data.metadata;
        const userId = metadata.userId;
        const amountInGHS = verification.data.amount / 100; // Convert from kobo to GHS
        
        // Update user subscription
        await User.findByIdAndUpdate(userId, {
          subscription: 'premium',
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          'settings.paymentMethod': metadata.paymentMethod,
          'settings.lastPaymentReference': reference
        });

        // ✅ CREATE SUBSCRIPTION RECORD FOR REVENUE TRACKING
        await new Subscription({
          userId: userId,
          // Map 'premium' to 'monthly' 
          plan: metadata.plan === 'premium' ? 'monthly' : (metadata.plan || 'monthly'),
          status: 'active',
          // Map payment methods to enum values
          paymentMethod: metadata.paymentMethod === 'card' ? 'paystack' 
                        : metadata.paymentMethod === 'mobile' ? 'mobile_money' 
                        : metadata.paymentMethod || 'paystack',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentAmount: amountInGHS,
          paymentCurrency: verification.data.currency || 'GHS',
          paymentDate: new Date(verification.data.paid_at),
          paymentReference: reference
        }).save();

        res.json({ 
          success: true, 
          message: 'Payment verified successfully',
          subscription: 'premium'
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: 'Payment verification failed' 
        });
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Verification failed' 
      });
    }
  },

  // Cancel subscription (graceful cancellation)
  async cancelSubscription(req, res) {
    try {
      const userId = req.session.userId;
      const user = await User.findById(userId);
      
      if (!user || user.subscription !== 'premium') {
        return res.status(400).json({ 
          success: false, 
          error: 'No active subscription found' 
        });
      }

      // If using Paystack subscriptions (not one-time payments)
      if (user.paystack?.subscriptionCode) {
        // Cancel via Paystack API
        await axios.post(
          `https://api.paystack.co/subscription/${user.paystack.subscriptionCode}/disable`,
          {},
          { 
            headers: { 
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        res.json({ 
          success: true, 
          message: 'Subscription cancelled successfully. You will retain premium access until the end of your current billing period.' 
        });
      } else {
        // For your current one-time payment model
        await User.findByIdAndUpdate(userId, {
          subscriptionExpiry: new Date() // Immediate downgrade
        });
        
        res.json({ 
          success: true, 
          message: 'Premium access ended immediately.' 
        });
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to cancel subscription. Please contact support.' 
      });
    }
  },

  // Get subscription status
  async getSubscriptionStatus(req, res) {
    try {
      const userId = req.session.userId;
      const user = await User.findById(userId).select('subscription subscriptionExpiry');
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      // Check if subscription has expired
      if (user.subscription === 'premium' && user.subscriptionExpiry < new Date()) {
        // Auto-downgrade expired subscriptions
        await User.findByIdAndUpdate(userId, {
          subscription: 'free',
          subscriptionExpiry: null
        });
        user.subscription = 'free';
        user.subscriptionExpiry = null;
      }
      
      res.json({
        success: true,
        subscription: user.subscription,
        expiryDate: user.subscriptionExpiry
      });
    } catch (error) {
      console.error('Get subscription status error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch subscription status' 
      });
    }
  }
};

module.exports = subscriptionController;