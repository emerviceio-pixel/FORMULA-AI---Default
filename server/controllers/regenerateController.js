// server/controllers/regenerateController.js
const Scan = require('../models/Scan');
const User = require('../models/User');
const RecommendationService = require('../services/RecommendationService');
const AIService = require('../services/AIService');

// Track regenerate attempts in memory
const regenerateAttempts = new Map();

const regenerateController = {
  async regenerateRecommendation(req, res) {
    try {
      const { scanId } = req.body;
      const userId = req.session.userId;

      if (!scanId) {
        return res.status(400).json({
          success: false,
          error: 'Scan ID is required'
        });
      }

      // Get original scan
      const originalScan = await Scan.findById(scanId);
      if (!originalScan) {
        return res.status(404).json({
          success: false,
          error: 'Original scan not found'
        });
      }

      // Get user
      const user = await User.findById(userId)
        .select('+healthConditionsSystemEncrypted +allergiesSystemEncrypted subscription country dietaryGoal bmiCategory activityLevel dateOfBirth');

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const isPremium = user.subscription === 'premium';

      // Check if input type allows regeneration
      const inputType = originalScan.inputType || 
        (originalScan.isSpecialKey ? 'SPECIAL_KEY' : 
        originalScan.isRestaurant ? 'RESTAURANT_NAME' : 
        originalScan.foodName.includes(' from ') ? 'RESTAURANT_NAME' : 'SPECIAL_KEY');

      if (inputType !== 'SPECIAL_KEY' && inputType !== 'RESTAURANT_NAME') {
        return res.status(400).json({
          success: false,
          error: 'Regeneration only available for special keys and restaurant recommendations'
        });
      }

      // Get trigger value from original scan
      const triggerValue = originalScan.triggerValue || 
        (inputType === 'SPECIAL_KEY' ? originalScan.foodName : originalScan.foodName.split(' from ')[1]) ||
        originalScan.foodName;

      // Get last recommended item to avoid immediate repeat
      const lastItem = originalScan.foodName;

      // Use AIService for regeneration
      let aiResponse;
      if (inputType === 'SPECIAL_KEY') {
        aiResponse = await AIService.generateRecommendation(triggerValue, user, lastItem);
      } else {
        aiResponse = await AIService.analyzeRestaurant(triggerValue, user, lastItem);
      }

      // Save new scan
      const newScan = new Scan({
        userId,
        foodName: aiResponse.foodName,
        safetyStatus: aiResponse.status || 'SAFE',
        analysis: aiResponse.reason,
        tips: aiResponse.tips || [],
        recommendedPortion: aiResponse.maxServing,
        bestTimeToEat: aiResponse.bestTime,
        alternatives: aiResponse.alternatives || [],
        inputType,
        triggerValue,
        scannedAt: new Date(),
        isRegeneration: true,
        originalScanId: scanId
      });

      await newScan.save();

      // Track the new recommendation
      await RecommendationService.trackRecommendation(
        userId,
        inputType,
        triggerValue,
        aiResponse.foodName,
        aiResponse.status || 'SAFE',
        newScan._id,
        aiResponse.price,
        aiResponse.isCombinationMeal || false
      );

      // Track regenerate attempt for rate limiting
      trackRegenerateAttempt(userId);
      
      // Get remaining attempts
      const remaining = getRemainingAttempts(userId);

      res.json({
        success: true,
        scan: {
          id: newScan._id,
          foodName: newScan.foodName,
          status: newScan.safetyStatus,
          reason: newScan.analysis,
          tips: newScan.tips,
          maxServing: newScan.recommendedPortion,
          bestTime: newScan.bestTimeToEat,
          alternatives: newScan.alternatives,
          scannedAt: newScan.scannedAt,
          inputType,
          triggerValue
        },
        remaining: remaining
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to regenerate recommendation'
      });
    }
  },

  // Check remaining regenerate attempts
  async checkRegenerateLimit(req, res) {
    try {
      const userId = req.session.userId;
      const remaining = getRemainingAttempts(userId);
      const resetIn = getResetTime(userId);
      
      res.json({
        success: true,
        remaining,
        resetIn
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to check limit' 
      });
    }
  }
};

// Helper functions for rate limiting
function trackRegenerateAttempt(userId) {
  if (!regenerateAttempts.has(userId)) {
    regenerateAttempts.set(userId, []);
  }
  
  const attempts = regenerateAttempts.get(userId);
  const now = Date.now();
  
  // Remove attempts older than 1 minute
  const recentAttempts = attempts.filter(t => now - t < 60000);
  recentAttempts.push(now);
  
  regenerateAttempts.set(userId, recentAttempts);
}

function getRemainingAttempts(userId) {
  const attempts = regenerateAttempts.get(userId) || [];
  const now = Date.now();
  const recentAttempts = attempts.filter(t => now - t < 60000);
  return Math.max(0, 5 - recentAttempts.length);
}

function getResetTime(userId) {
  const attempts = regenerateAttempts.get(userId) || [];
  const now = Date.now();
  const recentAttempts = attempts.filter(t => now - t < 60000);
  
  if (recentAttempts.length >= 5) {
    const oldestAttempt = Math.min(...recentAttempts);
    return Math.ceil((oldestAttempt + 60000 - now) / 1000);
  }
  
  return 0;
}

module.exports = regenerateController;