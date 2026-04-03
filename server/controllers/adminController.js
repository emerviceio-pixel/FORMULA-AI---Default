// server/controllers/adminController.js
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const Subscription = require('../models/Subscription');

const adminController = {
  // Get dashboard overview
  async getDashboardOverview(req, res) {
    try {
      const totalUsers = await User.countDocuments();
      const premiumUsers = await User.countDocuments({ subscription: 'premium' });
      
      // Group users by country
      const usersByCountry = await User.aggregate([
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // Calculate all successful transactions
      const allTimeTransactions = await Subscription.find({
        paymentDate: { $exists: true },
        status: { $in: ['active', 'success'] }
      });

      const totalTransactionsAmount = allTimeTransactions.reduce((sum, t) => sum + (t.paymentAmount || 0), 0);

      res.json({
        success: true,
        data: {
          totalUsers,
          premiumUsers,
          freeUsers: totalUsers - premiumUsers,
          // ✅ Use these fields instead of estimatedRevenue
          totalTransactionsAmount: parseFloat(totalTransactionsAmount.toFixed(2)),
          totalTransactionsCount: allTimeTransactions.length,
          usersByCountry
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch dashboard data' 
      });
    }
  },

  // Get monthly revenue statement - UPDATED VERSION
  async getMonthlyRevenue(req, res) {
    try {
      const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
      
      // Validate inputs
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid year or month' 
        });
      }
      
      // Create date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      // First, get all subscriptions with populated user data
      const subscriptions = await Subscription.find({
        paymentDate: { $gte: startDate, $lte: endDate },
        status: { $in: ['active', 'success', 'cancelled','pending_approval'] }
      })
      .populate('userId', 'email')
      .sort({ paymentDate: -1 });
      
      // Filter out subscriptions where user no longer exists
      const validSubscriptions = subscriptions.filter(sub => sub.userId !== null);
      
      // Calculate revenue from valid subscriptions only
      let totalRevenue = 0;
      const revenueByCurrency = {};
      const transactions = [];
      
      validSubscriptions.forEach(sub => {
        // Add to total revenue
        totalRevenue += sub.paymentAmount || 0;
        
        // Group by currency
        if (!revenueByCurrency[sub.paymentCurrency]) {
          revenueByCurrency[sub.paymentCurrency] = {
            amount: 0,
            count: 0
          };
        }
        revenueByCurrency[sub.paymentCurrency].amount += sub.paymentAmount || 0;
        revenueByCurrency[sub.paymentCurrency].count += 1;
        
        // Add to transactions array with all required fields
        transactions.push({
          _id: sub._id,
          paymentDate: sub.paymentDate,
          userEmail: sub.userId?.email || 'Deleted User',
          amount: sub.paymentAmount,
          paymentMethod: sub.paymentMethod,
          paymentCurrency: sub.paymentCurrency,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          plan: sub.plan,
          paymentReference: sub.paymentReference
        });
      });
      
      // Get daily breakdown for chart
      const dailyRevenue = await Subscription.aggregate([
        {
          $match: {
            paymentDate: { $gte: startDate, $lte: endDate },
            status: { $in: ['active', 'success'] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $match: {
            'user.0': { $exists: true } // Only include if user exists
          }
        },
        {
          $group: {
            _id: { 
              $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } 
            },
            dailyAmount: { $sum: '$paymentAmount' },
            dailyCount: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      res.json({
        success: true,
        data: {
          period: {
            year: parseInt(year),
            month: parseInt(month),
            monthName: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })
          },
          summary: {
            totalRevenue,
            totalTransactions: validSubscriptions.length,
            currencies: revenueByCurrency
          },
          dailyBreakdown: dailyRevenue.map(day => ({
            date: day._id,
            amount: day.dailyAmount,
            transactions: day.dailyCount
          })),
          transactions // Add the detailed transactions array
        }
      });
    } catch (error) {
      console.error('Monthly revenue error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch revenue data' 
      });
    }
  },

  // Search users by email
  async searchUsersByEmail(req, res) {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email parameter required' 
        });
      }
      
      const users = await User.find({ 
        email: { $regex: email, $options: 'i' } 
      }).select('-healthConditionsSystemEncrypted -allergiesSystemEncrypted');
      
      res.json({ 
        success: true, 
        data: users 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to search users' 
      });
    }
  },

  // Get all users with pagination
  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      const users = await User.find()
        .select('-healthConditionsSystemEncrypted -allergiesSystemEncrypted')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await User.countDocuments();
      
      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalUsers: total,
            limit,
            skip
          }
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch users' 
      });
    }
  },

  // Get feedback analytics overview
  async getFeedbackAnalytics(req, res) {
    try {
      const totalFeedback = await Feedback.countDocuments();
      const goodFeedback = await Feedback.countDocuments({ feedbackType: 'good' });
      const badFeedback = await Feedback.countDocuments({ feedbackType: 'bad' });
      
      // Top problematic inputs (most bad feedback)
      const problematicInputs = await Feedback.aggregate([
        { $match: { feedbackType: 'bad' } },
        { $group: { _id: '$originalInput', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      // Feedback by country
      const feedbackByCountry = await Feedback.aggregate([
        { 
          $group: { 
            _id: '$userCountry', 
            good: { $sum: { $cond: [{ $eq: ['$feedbackType', 'good'] }, 1, 0] } },
            bad: { $sum: { $cond: [{ $eq: ['$feedbackType', 'bad'] }, 1, 0] } },
            total: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]);
      
      // Feedback by input type
      const feedbackByInputType = await Feedback.aggregate([
        { 
          $group: { 
            _id: '$inputType', 
            good: { $sum: { $cond: [{ $eq: ['$feedbackType', 'good'] }, 1, 0] } },
            bad: { $sum: { $cond: [{ $eq: ['$feedbackType', 'bad'] }, 1, 0] } },
            total: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]);
      
      // Daily feedback trends (last 7 days)
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      
      const dailyTrends = await Feedback.aggregate([
        { $match: { createdAt: { $gte: last7Days } } },
        {
          $group: {
            _id: { 
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            good: { $sum: { $cond: [{ $eq: ['$feedbackType', 'good'] }, 1, 0] } },
            bad: { $sum: { $cond: [{ $eq: ['$feedbackType', 'bad'] }, 1, 0] } },
            total: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      res.json({
        success: true,
        data: {
          totalFeedback,
          goodFeedback,
          badFeedback,
          accuracyRate: totalFeedback > 0 
            ? parseFloat(((goodFeedback / totalFeedback) * 100).toFixed(2)) 
            : 0,
          problematicInputs,
          feedbackByCountry,
          feedbackByInputType,
          dailyTrends
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch feedback analytics' 
      });
    }
  },

  // Get detailed feedback list
  async getFeedbackList(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const { type, country, inputType } = req.query;
      
      // Build filter query
      const filter = {};
      if (type) filter.feedbackType = type;
      if (country) filter.userCountry = country;
      if (inputType) filter.inputType = inputType;
      
      // Get feedback with user and scan details
      const feedbackList = await Feedback.find(filter)
        .populate('userId', 'email nickname country subscription')
        .populate('scanId', 'foodName safetyStatus analysis createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Feedback.countDocuments(filter);
      
      // Get unique countries for filter dropdown
      const countries = await Feedback.distinct('userCountry');
      const inputTypes = await Feedback.distinct('inputType');
      
      res.json({
        success: true,
        data: {
          feedback: feedbackList,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalFeedback: total,
            limit,
            skip
          },
          filters: {
            countries: countries.filter(c => c), // Remove null/undefined
            inputTypes: inputTypes.filter(t => t)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch feedback list' 
      });
    }
  },

  // Get feedback details by ID
  async getFeedbackById(req, res) {
    try {
      const { id } = req.params;
      
      const feedback = await Feedback.findById(id)
        .populate('userId', 'email nickname country subscription createdAt')
        .populate('scanId');
      
      if (!feedback) {
        return res.status(404).json({ 
          success: false, 
          error: 'Feedback not found' 
        });
      }
      
      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch feedback details' 
      });
    }
  },

  // Get active users by time range
  async getActiveUsersByRange(req, res) {
    try {
      const { range = '10m' } = req.query;
      let cutoffDate;

      switch (range) {
        case '10m':
          cutoffDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes
          break;
        case '24h':
          cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
          break;
        case '7d':
          cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
          break;
        case '30d':
          cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
          break;
        default:
          cutoffDate = new Date(Date.now() - 10 * 60 * 1000);
      }

      const activeUsers = await User.find({
        lastActiveAt: { $gte: cutoffDate }
      }).select('email nickname country subscription lastActiveAt createdAt');

      res.json({
        success: true,
        data: {
          users: activeUsers,
          count: activeUsers.length,
          range
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch active users' 
      });
    }
  },

  // Export feedback data for AI training
  async exportFeedbackData(req, res) {
    try {
      const { format = 'json', startDate, endDate, type } = req.query;
      
      // Build date filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }
      
      // Build type filter
      const typeFilter = {};
      if (type) typeFilter.feedbackType = type;
      
      const feedbacks = await Feedback.find({ ...dateFilter, ...typeFilter })
        .populate('userId', 'country subscription')
        .populate('scanId', 'foodName safetyStatus')
        .sort({ createdAt: -1 });
      
      if (format === 'csv') {
        // Format as CSV for download
        const csvData = feedbacks.map(f => ({
          feedbackId: f._id.toString(),
          userId: f.userId?._id.toString() || 'anonymous',
          scanId: f.scanId?._id.toString() || 'unknown',
          feedbackType: f.feedbackType,
          originalInput: f.originalInput,
          inputType: f.inputType,
          aiResponse: JSON.stringify(f.aiResponse),
          userCountry: f.userCountry || 'unknown',
          userSubscription: f.userSubscription || 'free',
          createdAt: f.createdAt.toISOString()
        }));
        
        res.json({
          success: true,
          data: csvData,
          count: csvData.length
        });
      } else {
        // Default JSON format
        res.json({
          success: true,
          data: feedbacks,
          count: feedbacks.length
        });
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to export feedback data' 
      });
    }
  }
};

module.exports = adminController;