// services/accountDeletionService.js
const User = require('../models/User');
const DeletedAccount = require('../models/DeletedAccount');
const mongoose = require('mongoose');

class AccountDeletionService {
  async deleteAccount(userId, deletionData = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find user with all data (including encrypted fields)
      const user = await User.findById(userId)
        .select('+healthConditions +allergies +healthKeyHash +healthConditionsSystemEncrypted +allergiesSystemEncrypted')
        .session(session);

      if (!user) {
        throw new Error('User not found');
      }

      // Create deleted account record
      const deletedAccount = new DeletedAccount({
        originalUserId: user._id,
        googleId: user.googleId,
        email: user.email,
        nickname: user.nickname,
        userData: user.toObject(), // Full user document snapshot
        deletedBy: deletionData.deletedBy || 'user',
        deletionReason: deletionData.reason,
        userFeedback: deletionData.feedback,
        ipAddress: deletionData.ipAddress,
        userAgent: deletionData.userAgent
      });

      // Anonymize email for GDPR
      deletedAccount.anonymize();

      // Save deleted account record
      await deletedAccount.save({ session });

      // Permanently delete user
      await User.deleteOne({ _id: userId }).session(session);

      // Commit transaction
      await session.commitTransaction();

      // Log deletion for audit (optional)
      console.log(`Account deleted: ${userId} at ${new Date().toISOString()}`);

      return {
        success: true,
        deletedAccountId: deletedAccount._id,
        message: 'Account permanently deleted'
      };

    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new AccountDeletionService();