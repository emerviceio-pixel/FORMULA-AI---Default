// server/models/Recommendation.js
const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  triggerType: {
    type: String,
    enum: ['SPECIAL_KEY', 'RESTAURANT_NAME'],
    required: true
  },
  triggerValue: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  recommendedItem: {
    type: String,
    required: true
  },
  itemPrice: {
    type: String,
    default: null
  },
  isCombinationMeal: {
    type: Boolean,
    default: false
  },
  safetyStatus: {
    type: String,
    enum: ['SAFE', 'CAUTIOUS', 'UNSAFE'],
    default: 'SAFE'
  },
  recommendedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan'
  },
  feedback: {
    type: String,
    enum: ['good', 'bad', null],
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes
recommendationSchema.index({ userId: 1, triggerType: 1, triggerValue: 1, recommendedAt: -1 });

// Constants for cleanup limits
recommendationSchema.statics.LIMITS = {
  RESTAURANT_NAME: 15,
  SPECIAL_KEY: 25
};

// Cleanup method - maintains max items per trigger
recommendationSchema.statics.cleanupOldRecommendations = async function(userId, triggerType, triggerValue) {
  const limit = this.LIMITS[triggerType];
  if (!limit) return;

  const count = await this.countDocuments({
    userId,
    triggerType,
    triggerValue: triggerValue.toLowerCase()
  });

  if (count > limit) {
    const excess = count - limit;
    const oldestToDelete = await this.find({
      userId,
      triggerType,
      triggerValue: triggerValue.toLowerCase()
    })
    .sort({ recommendedAt: 1 })
    .limit(excess)
    .select('_id');

    if (oldestToDelete.length > 0) {
      const idsToDelete = oldestToDelete.map(doc => doc._id);
      await this.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`🧹 Cleaned up ${excess} old recommendations for ${triggerType}: ${triggerValue}`);
    }
  }
};

module.exports = mongoose.model('Recommendation', recommendationSchema);