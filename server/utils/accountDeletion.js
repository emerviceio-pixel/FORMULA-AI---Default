const cron = require('node-cron');
const User = require('../models/User');

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running account deletion cleanup...');
  
  try {
    const usersToDelete = await User.find({
      markedForDeletion: { $ne: null },
      deletionScheduledAt: { $lte: new Date() }
    });
    
    console.log(`Found ${usersToDelete.length} accounts to delete`);
    
    for (const user of usersToDelete) {
      try {
        await user.permanentDelete();
        console.log(`Deleted account: ${user.email}`);
      } catch (error) {
        console.error(`Failed to delete ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Deletion scheduler error:', error);
  }
});

// Immediate delete function (for testing/admin)
const deleteUserImmediately = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return { success: false, error: 'User not found' };
    
    await user.permanentDelete();
    return { success: true, message: 'Account deleted immediately' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { deleteUserImmediately };

//Account Deletion Scheduler