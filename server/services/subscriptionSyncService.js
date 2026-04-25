// server/services/subscriptionSyncService.js
const User = require('../models/User');
const Subscription = require('../models/Subscription');

/**
 * Sync user's subscription status with their active subscription record
 */
async function syncUserSubscriptionStatus(userId) {
  try {
    // Find the most recent subscription for this user
    const latestSubscription = await Subscription.findOne({ userId })
      .sort({ endDate: -1 });

    const user = await User.findById(userId);
    if (!user) return null;

    if (!latestSubscription) {
      // No subscription found, set to free
      user.subscription = 'free';
      user.subscriptionExpiry = null;
      await user.save();
      return { subscription: 'free', isActive: false };
    }

    // Check if subscription is active and not expired
    const now = new Date();
    const isActive = 
      latestSubscription.status === 'active' && 
      latestSubscription.endDate > now;

    if (isActive) {
      // Premium subscription is still active
      user.subscription = 'premium';
      user.subscriptionExpiry = latestSubscription.endDate;
    } else {
      // Subscription has expired
      user.subscription = 'free';
      user.subscriptionExpiry = null;
    }

    await user.save();

    return {
      subscription: user.subscription,
      isActive,
      endDate: latestSubscription.endDate,
      status: latestSubscription.status
    };
  } catch (error) {
    console.error('Error syncing subscription status:', error);
    return null;
  }
}

/**
 * Batch update all users' subscription statuses
 * Run periodically when subscriptions are updated
 */
async function syncAllUsersSubscriptions() {
  try {
    const users = await User.find({ subscription: 'premium' });
    const results = [];

    for (const user of users) {
      const result = await syncUserSubscriptionStatus(user._id);
      results.push({ userId: user._id, result });
    }

    console.log(`✅ Synced ${results.length} premium users' subscription statuses`);
    return results;
  } catch (error) {
    console.error('Error syncing all subscriptions:', error);
    return [];
  }
}

module.exports = {
  syncUserSubscriptionStatus,
  syncAllUsersSubscriptions
};
