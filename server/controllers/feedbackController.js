// server/controllers/feedbackController.js
const Feedback = require('../models/Feedback');
const Scan = require('../models/Scan');
const User = require('../models/User');
const { decrypt } = require('../utils/encryption');

// Submit or update feedback (upsert)
const submitFeedback = async (req, res) => {
  try {
    const { scanId, feedbackType } = req.body;
    const userId = req.session.userId;
    
    if (!scanId || !feedbackType) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    
    if (!['good', 'bad'].includes(feedbackType)) {
      return res.status(400).json({ success: false, error: 'Invalid feedback type' });
    }
    
    // Verify scan exists and belongs to user
    const scan = await Scan.findById(scanId);
    if (!scan) {
      return res.status(404).json({ success: false, error: 'Scan not found' });
    }
    
    if (scan.userId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized access' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Check if feedback already exists for this scan and user
    const existingFeedback = await Feedback.findOne({ userId, scanId });
    
    if (existingFeedback) {
      // If feedback already exists and it's the same type, return success without changes
      if (existingFeedback.feedbackType === feedbackType) {
        return res.json({ 
          success: true, 
          message: 'Feedback already recorded',
          alreadyExists: true,
          feedbackType: existingFeedback.feedbackType
        });
      }
      
      // If different type, update the existing feedback
      existingFeedback.feedbackType = feedbackType;
      existingFeedback.updatedAt = new Date();
      await existingFeedback.save();
      
      return res.json({ 
        success: true, 
        message: 'Feedback updated successfully',
        updated: true,
        feedbackType: existingFeedback.feedbackType
      });
    }
    
    // Create new feedback
    const feedback = new Feedback({
      userId,
      scanId,
      feedbackType,
      originalInput: scan.foodName || 'Unknown',
      inputType: scan.inputType || 'VALID_FOOD',
      aiResponse: {
        status: scan.safetyStatus || 'UNKNOWN',
        reason: scan.analysis || 'No analysis',
        tips: scan.tips || [],
        maxServing: scan.recommendedPortion || 'Unknown',
        bestTime: scan.bestTimeToEat || 'Any time'
      },
      userCountry: user.country,
      userHealthConditions: decrypt(user.healthConditionsSystemEncrypted) || [],
      userAllergies: decrypt(user.allergiesSystemEncrypted) || [],
      userSubscription: user.subscription
    });
    
    await feedback.save();
    
    res.json({ 
      success: true, 
      message: 'Feedback recorded successfully',
      feedbackType: feedback.feedbackType
    });
    
  } catch (error) {
    console.error('Feedback error:', error);
    
    // Handle duplicate key error from unique index
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Feedback already exists for this scan',
        alreadyExists: true
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to record feedback' });
  }
};

// Get existing feedback for a scan
const getFeedbackStatus = async (req, res) => {
  try {
    const { scanId } = req.params;
    const userId = req.session.userId;
    
    if (!scanId) {
      return res.status(400).json({ success: false, error: 'Scan ID required' });
    }
    
    const feedback = await Feedback.findOne({ userId, scanId }).select('feedbackType createdAt updatedAt');
    
    res.json({
      success: true,
      hasFeedback: !!feedback,
      feedbackType: feedback?.feedbackType || null,
      submittedAt: feedback?.createdAt || null,
      updatedAt: feedback?.updatedAt || null
    });
    
  } catch (error) {
    console.error('Error fetching feedback status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feedback status' });
  }
};

// Get feedback statistics for a scan (admin/analytics)
const getFeedbackStats = async (req, res) => {
  try {
    const { scanId } = req.params;
    
    const stats = await Feedback.aggregate([
      { $match: { scanId: mongoose.Types.ObjectId(scanId) } },
      { $group: {
        _id: '$feedbackType',
        count: { $sum: 1 }
      }}
    ]);
    
    const goodCount = stats.find(s => s._id === 'good')?.count || 0;
    const badCount = stats.find(s => s._id === 'bad')?.count || 0;
    const total = goodCount + badCount;
    
    res.json({
      success: true,
      stats: {
        good: goodCount,
        bad: badCount,
        total,
        accuracyRate: total > 0 ? (goodCount / total * 100).toFixed(1) : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feedback stats' });
  }
};

module.exports = { submitFeedback, getFeedbackStatus, getFeedbackStats };