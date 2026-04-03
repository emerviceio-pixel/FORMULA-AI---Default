// server/scripts/cleanupSingleUser.js
require('dotenv').config();
const mongoose = require('mongoose');
const Recommendation = require('../models/Recommendation');

async function cleanupSingleUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 👇 CHANGE THIS USER ID TO THE ONE YOU WANT
    const targetUserId = '67d7cbc3c8d30cfa84079036'; 
    
    console.log(`Cleaning up recommendations for user: ${targetUserId}`);

    // Get all trigger groups for this specific user
    const groups = await Recommendation.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(targetUserId) }
      },
      {
        $group: {
          _id: {
            triggerType: "$triggerType",
            triggerValue: "$triggerValue"
          },
          count: { $sum: 1 },
          oldestDate: { $min: "$recommendedAt" }
        }
      },
      {
        $sort: { "oldestDate": 1 }
      }
    ]);

    console.log(`Found ${groups.length} trigger groups for this user`);

    for (const group of groups) {
      const { triggerType, triggerValue } = group._id;
      console.log(`\nChecking ${triggerType}: ${triggerValue} (${group.count} items)`);
      
      await Recommendation.cleanupOldRecommendations(
        targetUserId, 
        triggerType, 
        triggerValue
      );
    }

    // Verify cleanup
    const remainingCount = await Recommendation.countDocuments({ userId: targetUserId });
    console.log(`\n✅ Cleanup complete. User now has ${remainingCount} total recommendations`);

    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupSingleUser();