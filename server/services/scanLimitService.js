// server/services/scanLimitService.js
const ScanLimit = require('../models/ScanLimit');
const User = require('../models/User');
const scanLimits = require('../config/scanLimits');

class ScanLimitService {
  /**
   * Get or create scan limit for user
   */
  static async getOrCreateLimit(userId, isPremium = false) {
    // Use a single upsert operation to avoid duplicate key errors under concurrency.
    const limit = await ScanLimit.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          scansUsed: 0,
          limitReachedAt: null,
          nextResetAt: null,
          isPremium
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    // If premium status changes on an existing limit, update it separately
    if (limit.isPremium !== isPremium) {
      limit.isPremium = isPremium;
      await limit.save();
    }

    return limit;
  }

  /**
   * Check if limit needs reset and handle it
   */
  static async checkAndResetLimit(userId, isPremium) {
    const limit = await this.getOrCreateLimit(userId, isPremium);
    const now = new Date();
    
    // If limit is reached and we have a nextResetAt that's passed
    if (limit.nextResetAt && limit.nextResetAt <= now) {
      limit.scansUsed = 0;
      limit.limitReachedAt = null;
      limit.nextResetAt = null;
      await limit.save();
      
      // Also update User model for backward compatibility
      await User.findByIdAndUpdate(userId, {
        dailyScans: 0,
        lastScanReset: now
      });
      
      return { reset: true, limit };
    }
    
    return { reset: false, limit };
  }

  /**
   * Increment scan count
   */
  static async incrementScan(userId, isPremium) {
    const limit = await this.getOrCreateLimit(userId, isPremium);
    const scanLimit = scanLimits.getScanLimit(isPremium);
    const resetHours = scanLimits.getResetHours(isPremium);
    
    // Check if we need to reset first
    if (limit.nextResetAt && limit.nextResetAt <= new Date()) {
      limit.scansUsed = 0;
      limit.limitReachedAt = null;
      limit.nextResetAt = null;
    }
    
    limit.scansUsed += 1;
    
    // Check if limit reached
    if (scanLimit !== Infinity && limit.scansUsed >= scanLimit) {
      const now = new Date();
      limit.limitReachedAt = now;
      limit.nextResetAt = new Date(now.getTime() + (resetHours * 60 * 60 * 1000));
    }
    
    await limit.save();
    
    // Update User model for backward compatibility
    await User.findByIdAndUpdate(userId, {
      dailyScans: limit.scansUsed,
      lastScanReset: limit.limitReachedAt || new Date(),
      $inc: { totalScans: 1 }
    });
    
    return limit;
  }

  /**
   * Get scan status with formatted reset time
   */
  static async getScanStatus(userId, isPremium) {
    const { reset, limit } = await this.checkAndResetLimit(userId, isPremium);
    const scanLimit = scanLimits.getScanLimit(isPremium);
    const resetHours = scanLimits.getResetHours(isPremium);
    
    let resetIn = null;
    let resetTimestamp = null;
    
    if (limit.nextResetAt) {
      resetTimestamp = limit.nextResetAt.getTime();
      const now = new Date();
      const msUntilReset = limit.nextResetAt - now;
      
      if (msUntilReset > 0) {
        const hoursUntilReset = msUntilReset / (1000 * 60 * 60);
        
        if (hoursUntilReset < 1) {
          const minutes = Math.ceil(msUntilReset / (1000 * 60));
          resetIn = `${minutes} min${minutes > 1 ? 's' : ''}`;
        } else {
          const hrs = Math.floor(hoursUntilReset);
          const mins = Math.ceil((hoursUntilReset - hrs) * 60);
          resetIn = mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hour${hrs > 1 ? 's' : ''}`;
        }
      }
    }
    
    const scansUsed = limit.scansUsed || 0;
    const limitReached = scanLimit !== Infinity && scansUsed >= scanLimit;
    
    return {
      scansUsed,
      scanLimit: scanLimit === Infinity ? 'Unlimited' : scanLimit,
      remaining: scanLimit === Infinity ? 'Unlimited' : Math.max(0, scanLimit - scansUsed),
      isPremium,
      resetIn,
      resetTimestamp, // For client-side countdown
      limitReached,
      needsReset: reset
    };
  }

  /**
   * Reset limit manually
   */
  static async resetLimit(userId) {
    const limit = await ScanLimit.findOne({ userId });
    if (limit) {
      limit.scansUsed = 0;
      limit.limitReachedAt = null;
      limit.nextResetAt = null;
      await limit.save();
      
      await User.findByIdAndUpdate(userId, {
        dailyScans: 0,
        lastScanReset: new Date()
      });
    }
  }
}

module.exports = ScanLimitService;