// server/services/RecommendationService.js
const Recommendation = require('../models/Recommendation');

class RecommendationService {
  /**
   * Get recent recommendations for a user
   */
  async getRecentRecommendations(userId, triggerType, triggerValue, limit = 10) {
    try {
      const recentRecs = await Recommendation.find({
        userId,
        triggerType,
        triggerValue: triggerValue.toLowerCase()
      })
      .sort({ recommendedAt: -1 })
      .limit(limit)
      .lean();

      return recentRecs;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get recommendation history formatted for AI prompt
   */
  async getRecommendationHistoryForPrompt(userId, triggerType, triggerValue) {
    const recentRecs = await this.getRecentRecommendations(userId, triggerType, triggerValue, 15);
    
    if (recentRecs.length === 0) {
      return 'No recent recommendations';
    }

    // Separate safe items from combination meals
    const safeItems = recentRecs.filter(r => r.safetyStatus === 'SAFE' && !r.isCombinationMeal);
    const comboMeals = recentRecs.filter(r => r.isCombinationMeal);

    let historyText = 'RECENTLY RECOMMENDED ITEMS (DO NOT REPEAT THESE):\n';
    
    if (safeItems.length > 0) {
      historyText += '\nIndividual Items already recommended:\n';
      safeItems.forEach((rec, i) => {
        historyText += `${i + 1}. ${rec.recommendedItem} (${new Date(rec.recommendedAt).toLocaleDateString()})\n`;
      });
    }

    if (comboMeals.length > 0) {
      historyText += '\nCombination Meals already recommended:\n';
      comboMeals.forEach((rec, i) => {
        historyText += `${i + 1}. ${rec.recommendedItem} (${new Date(rec.recommendedAt).toLocaleDateString()})\n`;
      });
    }

    historyText += '\nIMPORTANT:';
    historyText += '\n1. First, try to recommend individual menu items not listed above';
    historyText += '\n2. Only if all individual items are exhausted, recommend combination meals';
    historyText += '\n3. Combination meals must be explicitly marked as safe and clearly identified as "Combo Meal"';

    return historyText;
  }

  /**
   * Track a new recommendation with automatic cleanup
   */
  async trackRecommendation(userId, triggerType, triggerValue, recommendedItem, safetyStatus = 'SAFE', scanId = null, price = null, isCombinationMeal = false) {
    try {
      const recommendation = new Recommendation({
        userId,
        triggerType,
        triggerValue: triggerValue.toLowerCase(),
        recommendedItem,
        itemPrice: price,
        isCombinationMeal,
        safetyStatus,
        scanId,
        recommendedAt: new Date()
      });

      await recommendation.save();
      
      // Clean up old recommendations to maintain limits
      await Recommendation.cleanupOldRecommendations(userId, triggerType, triggerValue);
      
      console.log(`✅ Tracked new ${triggerType} recommendation: ${recommendedItem}${price ? ` (${price})` : ''}`);
      return recommendation;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user has exhausted all safe individual items
   */
  async hasExhaustedSafeItems(userId, triggerType, triggerValue) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const safeRecommendations = await Recommendation.find({
        userId,
        triggerType,
        triggerValue: triggerValue.toLowerCase(),
        safetyStatus: 'SAFE',
        isCombinationMeal: false,
        recommendedAt: { $gte: thirtyDaysAgo }
      });

      // If we have at least 15 safe items for restaurant or 25 for special keys, consider exhausted
      const limit = triggerType === 'RESTAURANT_NAME' ? 15 : 25;
      return safeRecommendations.length >= limit;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if an item was recently recommended (last 7 days)
   */
  async wasRecentlyRecommended(userId, triggerType, triggerValue, item) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recent = await Recommendation.findOne({
        userId,
        triggerType,
        triggerValue: triggerValue.toLowerCase(),
        recommendedItem: item,
        recommendedAt: { $gte: sevenDaysAgo }
      });

      return !!recent;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available items for regenerate, avoiding recent repeats
   */
  async getAvailableItemsForRegenerate(userId, triggerType, triggerValue, lastItem = null) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get all recommendations in last 7 days
      const recentRecs = await Recommendation.find({
        userId,
        triggerType,
        triggerValue: triggerValue.toLowerCase(),
        recommendedAt: { $gte: sevenDaysAgo }
      }).sort({ recommendedAt: -1 });

      const recentItems = recentRecs.map(r => r.recommendedItem);
      
      // If we have less than 10 unique items, try to avoid repeats
      if (recentItems.length < 10) {
        return {
          avoidItems: recentItems,
          canRepeat: false
        };
      }
      
      // If we have many items, allow repeats but try to avoid last item
      return {
        avoidItems: lastItem ? [lastItem] : [],
        canRepeat: true
      };
    } catch (error) {
      return {
        avoidItems: [],
        canRepeat: true
      };
    }
  }

  /**
   * Update recommendation with user feedback
   */
  async updateFeedback(scanId, feedbackType) {
    try {
      return await Recommendation.findOneAndUpdate(
        { scanId },
        { feedback: feedbackType },
        { new: true }
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Get recommendations count by type for a user
   */
  async getRecommendationStats(userId) {
    try {
      const stats = await Recommendation.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: {
              triggerType: "$triggerType",
              triggerValue: "$triggerValue"
            },
            count: { $sum: 1 },
            lastRecommended: { $max: "$recommendedAt" }
          }
        },
        { $sort: { lastRecommended: -1 } }
      ]);

      return stats;
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete old recommendations manually (for cleanup script)
   */
  async manualCleanup(userId, triggerType, triggerValue, limit) {
    try {
      const count = await Recommendation.countDocuments({
        userId,
        triggerType,
        triggerValue: triggerValue.toLowerCase()
      });

      if (count > limit) {
        const excess = count - limit;
        const oldestToDelete = await Recommendation.find({
          userId,
          triggerType,
          triggerValue: triggerValue.toLowerCase()
        })
        .sort({ recommendedAt: 1 })
        .limit(excess)
        .select('_id');

        if (oldestToDelete.length > 0) {
          const idsToDelete = oldestToDelete.map(doc => doc._id);
          await Recommendation.deleteMany({ _id: { $in: idsToDelete } });
        }
      }
    } catch (error) {
    }
  }
}

module.exports = new RecommendationService();