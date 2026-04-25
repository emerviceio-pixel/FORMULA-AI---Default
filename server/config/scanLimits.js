// server/config/scanLimits.js
// handles scan limit configuration from environment variables

const getScanLimits = () => {
  // Free user limit
  const freeLimit = parseInt(process.env.FREE_SCAN_LIMIT) || 15;
  
  // Premium user limit
  const premiumEnv = process.env.PREMIUM_SCAN_LIMIT?.toLowerCase();
  const premiumLimit = premiumEnv === 'unlimited' 
    ? Infinity 
    : (parseInt(process.env.PREMIUM_SCAN_LIMIT) || 50); 
  
  // Midnight reset config (default 00:00 from env)
  const scanResetTime = process.env.SCAN_RESET_TIME || '00:00';
  const [resetHour, resetMinute] = scanResetTime.split(':').map(Number);

  // Separate reset hours (legacy fallback; still available, but primary is midnight schedule)
  const freeResetHours = parseFloat(process.env.FREE_RESET_HOURS) || 12;
  const premiumResetHours = parseFloat(process.env.PREMIUM_RESET_HOURS) || 5;

  const getNextResetAt = (fromDate = new Date()) => {
    const now = new Date(fromDate);
    const resetDate = new Date(now);
    resetDate.setHours(Number.isNaN(resetHour) ? 0 : resetHour, Number.isNaN(resetMinute) ? 0 : resetMinute, 0, 0);

    if (resetDate <= now) {
      resetDate.setDate(resetDate.getDate() + 1);
    }

    return resetDate;
  };

  return {
    FREE_SCAN_LIMIT: freeLimit,
    PREMIUM_SCAN_LIMIT: premiumLimit,
    FREE_RESET_HOURS: freeResetHours,
    PREMIUM_RESET_HOURS: premiumResetHours,
    SCAN_RESET_TIME: scanResetTime,
    getNextResetAt,
    
    // Helper to get reset hours based on user type
    getResetHours: (isPremium) => {
      return isPremium ? premiumResetHours : freeResetHours;
    },
    
    // Helper to get scan limit based on user type (NEW)
    getScanLimit: (isPremium) => {
      return isPremium ? premiumLimit : freeLimit;
    },
    
    // Helper for display (FIXED typo: getDispslayLimit → getDisplayLimit)
    getDisplayLimit: (isPremium) => {
      if (isPremium) {
        return premiumLimit === Infinity ? 'Unlimited' : premiumLimit;
      }
      return freeLimit;
    },
    
    // Helper to check if limit is reached (NEW)
    isLimitReached: (scansUsed, isPremium) => {
      const limit = isPremium ? premiumLimit : freeLimit;
      return limit !== Infinity && scansUsed >= limit;
    },
    
    // Helper to get remaining scans (NEW)
    getRemaining: (scansUsed, isPremium) => {
      const limit = isPremium ? premiumLimit : freeLimit;
      if (limit === Infinity) return 'Unlimited';
      return Math.max(0, limit - scansUsed);
    }
  };
};

module.exports = getScanLimits();