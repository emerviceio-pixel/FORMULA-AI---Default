// server/scripts/cleanupRecommendations.js
require('dotenv').config();
const mongoose = require('mongoose');
const Recommendation = require('../models/Recommendation');

async function cleanupAllRecommendations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all unique user-trigger combinations
    const groups = await Recommendation.aggregate([
      {
        $group: {
          _id: {
            userId: "$userId",
            triggerType: "$triggerType",
            triggerValue: "$triggerValue"
          },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`Found ${groups.length} trigger groups to check`);

    for (const group of groups) {
      const { userId, triggerType, triggerValue } = group._id;
      await Recommendation.cleanupOldRecommendations(userId, triggerType, triggerValue);
    }

    console.log('Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupAllRecommendations();