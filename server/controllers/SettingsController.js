// controllers/SettingsController.js
const User = require('../models/User');
const DeletedAccount = require('../models/DeletedAccount');
const accountDeletionService = require('../services/accountDeletionService');

class SettingsController {
  // Get user settings
  async getSettings(req, res) {
    try {
      const userId = req.session.userId;
      const user = await User.findById(userId).select('settings subscription subscriptionExpiry');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.json({
        success: true,
        settings: user.settings,
        subscription: user.subscription,
        subscriptionExpiry: user.subscriptionExpiry
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get settings'
      });
    }
  }

  // Update settings
  async updateSettings(req, res) {
    try {
      const userId = req.session.userId;
      const { settings } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      if (settings) {
        user.settings = {
          ...user.settings,
          ...settings
        };
      }
      
      await user.save();
      
      res.json({
        success: true,
        message: 'Settings updated successfully',
        settings: user.settings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update settings'
      });
    }
  }

  // Update subscription
  async updateSubscription(req, res) {
    try {
      const userId = req.session.userId;
      const { plan } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      user.subscription = plan;
      
      if (plan === 'premium') {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        user.subscriptionExpiry = expiryDate;
      } else {
        user.subscriptionExpiry = null;
      }
      
      await user.save();
      
      res.json({
        success: true,
        message: `Subscription updated to ${plan}`,
        subscription: user.subscription,
        subscriptionExpiry: user.subscriptionExpiry
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update subscription'
      });
    }
  }

  // Permanently delete account
    async deleteAccount(req, res) {
    try {
        const userId = req.session.userId;
        const { reason, feedback } = req.body;
            
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        const result = await accountDeletionService.deleteAccount(userId, {
        reason,
        feedback,
        deletedBy: 'user',
        ipAddress,
        userAgent
        });

        // Destroy session after successful deletion
        req.session.destroy((err) => {
        if (err) {
        }
        });

        res.json({
        success: true,
        message: 'Your account has been permanently deleted',
        ...result
        });

    } catch (error) {
        res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete account'
        });
    }
    }

  // Get all deleted accounts (admin only)
  async getDeletedAccounts(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;
      
      const deletedAccounts = await DeletedAccount.find()
        .sort({ deletedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('email anonymizedEmail deletedAt deletionReason deletedBy');

      const total = await DeletedAccount.countDocuments();

      res.json({
        success: true,
        data: deletedAccounts,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get deleted accounts'
      });
    }
  }

  // Get single deleted account by ID (admin only)
  async getDeletedAccountById(req, res) {
    try {
      const { id } = req.params;
      
      const deletedAccount = await DeletedAccount.findById(id);
      
      if (!deletedAccount) {
        return res.status(404).json({
          success: false,
          error: 'Deleted account not found'
        });
      }

      res.json({
        success: true,
        data: deletedAccount
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get deleted account'
      });
    }
  }
}

module.exports = new SettingsController();