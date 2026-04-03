// server/controllers/scanController.js
const mongoose = require('mongoose');
const Scan = require('../models/Scan');
const User = require('../models/User');
const ScanLimitService = require('../services/ScanLimitService');
const scanLimits = require('../config/scanLimits');

const scanController = {
  // Get recent scans with ALL required fields and updated scan status
  async getRecentScans(req, res) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Not authenticated' 
        });
      }

      // Get user for premium status and other info
      const user = await User.findById(userId).select('subscription dailyScans lastScanReset totalScans');
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      const isPremium = user.subscription === 'premium' || user.subscription === 'Premium' || user.subscription === 'PRO';
      
      // Get scan status from service (this will handle any needed resets)
      const scanStatus = await ScanLimitService.getScanStatus(userId, isPremium);

      // Get scans with all necessary fields including inputType and triggerValue
      const scans = await Scan.find({ userId })
        .select('foodName safetyStatus analysis tips recommendedPortion bestTimeToEat alternatives scannedAt inputType triggerValue')
        .sort({ scannedAt: -1 })
        .limit(10);

      const formattedScans = scans.map(scan => ({
        id: scan._id,
        foodName: scan.foodName,
        status: scan.safetyStatus,
        reason: scan.analysis,
        tips: scan.tips,
        maxServing: scan.recommendedPortion,
        bestTime: scan.bestTimeToEat,
        alternatives: scan.alternatives,
        scannedAt: scan.scannedAt,
        inputType: scan.inputType || 'VALID_FOOD',
        triggerValue: scan.triggerValue || null
      }));

      res.json({ 
        success: true, 
        scans: formattedScans,
        scanStatus
      });

    } catch (error) {
      console.error('Error in getRecentScans:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch recent scans' 
      });
    }
  },

  // Get single scan by ID
  async getScanById(req, res) {
    try {
      const { scanId } = req.params;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Not authenticated' 
        });
      }

      const scan = await Scan.findOne({ 
        _id: scanId, 
        userId 
      }).select('foodName safetyStatus analysis tips recommendedPortion bestTimeToEat alternatives scannedAt inputType triggerValue');

      if (!scan) {
        return res.status(404).json({ 
          success: false, 
          error: 'Scan not found' 
        });
      }

      // Get user for premium status
      const user = await User.findById(userId).select('subscription');
      const isPremium = user?.subscription === 'premium';

      // Get current scan status
      const scanStatus = await ScanLimitService.getScanStatus(userId, isPremium);

      res.json({
        success: true,
        scan: {
          id: scan._id,
          foodName: scan.foodName,
          status: scan.safetyStatus,
          reason: scan.analysis,
          tips: scan.tips,
          maxServing: scan.recommendedPortion,
          bestTime: scan.bestTimeToEat,
          alternatives: scan.alternatives,
          scannedAt: scan.scannedAt,
          inputType: scan.inputType || 'VALID_FOOD',
          triggerValue: scan.triggerValue || null
        },
        scanStatus
      });

    } catch (error) {
      console.error('Error in getScanById:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch scan' 
      });
    }
  },

  // Get paginated scans for history page
  async getScanHistory(req, res) {
    try {
      const userId = req.session.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search || '';
      const status = req.query.status || null;
      const sort = req.query.sort || 'desc';
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Not authenticated' 
        });
      }

      // Build filter
      const filter = { userId };
      
      // Add search filter
      if (search) {
        filter.foodName = { $regex: search, $options: 'i' };
      }
      
      // Add status filter
      if (status && ['SAFE', 'CAUTIOUS', 'UNSAFE'].includes(status.toUpperCase())) {
        filter.safetyStatus = status.toUpperCase();
      }

      // Calculate skip for pagination
      const skip = (page - 1) * limit;
      
      // Get total count for pagination
      const total = await Scan.countDocuments(filter);
      
      // Get scans with pagination
      const scans = await Scan.find(filter)
        .select('foodName safetyStatus analysis tips recommendedPortion bestTimeToEat alternatives scannedAt inputType triggerValue')
        .sort({ scannedAt: sort === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      const formattedScans = scans.map(scan => ({
        id: scan._id,
        foodName: scan.foodName,
        status: scan.safetyStatus,
        reason: scan.analysis,
        tips: scan.tips,
        maxServing: scan.recommendedPortion,
        bestTime: scan.bestTimeToEat,
        alternatives: scan.alternatives,
        scannedAt: scan.scannedAt,
        inputType: scan.inputType || 'VALID_FOOD',
        triggerValue: scan.triggerValue || null
      }));

      // Get user for premium status
      const user = await User.findById(userId).select('subscription');
      const isPremium = user?.subscription === 'premium';
      
      // Get current scan status
      const scanStatus = await ScanLimitService.getScanStatus(userId, isPremium);

      res.json({
        success: true,
        scans: formattedScans,
        total,
        hasMore: total > skip + scans.length,
        page,
        limit,
        scanStatus
      });

    } catch (error) {
      console.error('Error in getScanHistory:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch scan history' 
      });
    }
  },

  // Get scans by date range
  async getScansByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Not authenticated' 
        });
      }

      // Build date filter
      const filter = { userId };
      
      if (startDate || endDate) {
        filter.scannedAt = {};
        if (startDate) filter.scannedAt.$gte = new Date(startDate);
        if (endDate) filter.scannedAt.$lte = new Date(endDate);
      }

      const scans = await Scan.find(filter)
        .select('foodName safetyStatus scannedAt inputType triggerValue')
        .sort({ scannedAt: -1 });

      // Get user for premium status
      const user = await User.findById(userId).select('subscription');
      const isPremium = user?.subscription === 'premium';

      // Get current scan status
      const scanStatus = await ScanLimitService.getScanStatus(userId, isPremium);

      // Group scans by date for easier frontend consumption
      const groupedScans = scans.reduce((acc, scan) => {
        const date = scan.scannedAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          id: scan._id,
          foodName: scan.foodName,
          status: scan.safetyStatus,
          time: scan.scannedAt,
          inputType: scan.inputType || 'VALID_FOOD',
          triggerValue: scan.triggerValue || null
        });
        return acc;
      }, {});

      res.json({
        success: true,
        groupedScans,
        totalCount: scans.length,
        scanStatus
      });

    } catch (error) {
      console.error('Error in getScansByDateRange:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch scans by date range' 
      });
    }
  },

  // Get scan statistics
  async getScanStats(req, res) {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Not authenticated' 
        });
      }

      // Get user for premium status
      const user = await User.findById(userId).select('subscription');
      const isPremium = user?.subscription === 'premium';

      // Get scan statistics
      const totalScans = await Scan.countDocuments({ userId });
      
      const statusCounts = await Scan.aggregate([
        { $match: { userId: userId } },
        { $group: {
          _id: '$safetyStatus',
          count: { $sum: 1 }
        }}
      ]);

      // Get scans by day for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const scansByDay = await Scan.aggregate([
        { 
          $match: { 
            userId: userId,
            scannedAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: { 
              $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Get most scanned foods
      const topFoods = await Scan.aggregate([
        { $match: { userId: userId } },
        { $group: {
          _id: '$foodName',
          count: { $sum: 1 },
          lastScanned: { $max: '$scannedAt' }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      // Get current scan status
      const scanStatus = await ScanLimitService.getScanStatus(userId, isPremium);

      // Format status counts
      const formattedStatusCounts = {
        SAFE: 0,
        CAUTIOUS: 0,
        UNSAFE: 0
      };

      statusCounts.forEach(item => {
        const status = item._id?.toUpperCase();
        if (status && formattedStatusCounts.hasOwnProperty(status)) {
          formattedStatusCounts[status] = item.count;
        }
      });

      res.json({
        success: true,
        stats: {
          totalScans,
          statusCounts: formattedStatusCounts,
          scansByDay,
          topFoods,
          scanStatus
        }
      });

    } catch (error) {
      console.error('Error in getScanStats:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch scan statistics' 
      });
    }
  },

  // Delete a scan
  async deleteScan(req, res) {
    try {
      const { scanId } = req.params;
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Not authenticated' 
        });
      }

      // Validate scanId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(scanId)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid scan ID' 
        });
      }

      const scan = await Scan.findOneAndDelete({ 
        _id: scanId, 
        userId 
      });

      if (!scan) {
        return res.status(404).json({ 
          success: false, 
          error: 'Scan not found' 
        });
      }

      // Update user's total scans count
      await User.findByIdAndUpdate(userId, {
        $inc: { totalScans: -1 }
      });

      res.json({
        success: true,
        message: 'Scan deleted successfully'
      });

    } catch (error) {
      console.error('Error in deleteScan:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete scan' 
      });
    }
  },

  // Manual reset of scan limit (admin only or for testing)
  async resetScanLimit(req, res) {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Not authenticated' 
        });
      }

      // Optional: Add admin check here if needed
      // const user = await User.findById(userId);
      // if (user.role !== 'admin') {
      //   return res.status(403).json({ success: false, error: 'Admin access required' });
      // }

      await ScanLimitService.resetLimit(userId);

      // Get updated status
      const user = await User.findById(userId).select('subscription');
      const isPremium = user?.subscription === 'premium';
      const scanStatus = await ScanLimitService.getScanStatus(userId, isPremium);

      res.json({
        success: true,
        message: 'Scan limit reset successfully',
        scanStatus
      });

    } catch (error) {
      console.error('Error in resetScanLimit:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to reset scan limit' 
      });
    }
  },

  // Get scan limit configuration
  async getScanLimitConfig(req, res) {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Not authenticated' 
        });
      }

      const user = await User.findById(userId).select('subscription');
      const isPremium = user?.subscription === 'premium';

      const config = {
        free: {
          limit: scanLimits.FREE_SCAN_LIMIT,
          resetHours: scanLimits.FREE_RESET_HOURS
        },
        premium: {
          limit: scanLimits.PREMIUM_SCAN_LIMIT === Infinity ? 'Unlimited' : scanLimits.PREMIUM_SCAN_LIMIT,
          resetHours: scanLimits.PREMIUM_RESET_HOURS
        },
        current: {
          isPremium,
          limit: scanLimits.getDisplayLimit(isPremium),
          resetHours: scanLimits.getResetHours(isPremium)
        }
      };

      res.json({
        success: true,
        config
      });

    } catch (error) {
      console.error('Error in getScanLimitConfig:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch scan limit configuration' 
      });
    }
  }
};

module.exports = scanController;