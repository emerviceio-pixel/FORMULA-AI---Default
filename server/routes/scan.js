// server/routes/scan.js
const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const ScanLimitService = require('../services/ScanLimitService');
const Scan = require('../models/Scan');

// All scan routes require authentication
router.use(requireAuth);

// Scan management
router.get('/recent', scanController.getRecentScans);
router.get('/stats', scanController.getScanStats);
router.get('/config', scanController.getScanLimitConfig);
router.get('/range', scanController.getScansByDateRange);

// History endpoint with pagination and filters - UPDATED to include inputType and triggerValue
router.get('/history', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }

    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      status = null,
      sort = 'desc'
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build filter object
    const filter = { userId };
    
    //  filter search across multiple fields
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = { $regex: searchTerm, $options: 'i' };
      
      // Search in foodName (AI recommendation) AND triggerValue (user's original input)
      filter.$or = [
        { foodName: searchRegex },
        { triggerValue: searchRegex }
      ];
      
      // Also search for special keys by matching inputType with search term
      // This allows finding all special key scans when searching for "breakfast", "lunch", etc.
      const specialKeyMatch = ['breakfast', 'lunch', 'dinner', 'snack', 'fruit'].includes(searchTerm.toLowerCase());
      if (specialKeyMatch) {
        filter.$or.push({ 
          inputType: 'SPECIAL_KEY',
          triggerValue: searchRegex
        });
      }
      
      // Also search for restaurant names
      filter.$or.push({ 
        inputType: 'RESTAURANT_NAME',
        triggerValue: searchRegex
      });
    }
    
    // Add status filter
    if (status && ['safe', 'cautious', 'unsafe'].includes(status.toLowerCase())) {
      filter.safetyStatus = status.toUpperCase();
    }
    
    // Determine sort order
    const sortOrder = sort === 'desc' ? -1 : 1;
    
    // Get total count for pagination
    const total = await Scan.countDocuments(filter);
    
    // Fetch scans with pagination
    const scans = await Scan.find(filter)
      .select('foodName safetyStatus analysis tips recommendedPortion bestTimeToEat alternatives scannedAt inputType triggerValue')
      .sort({ scannedAt: sortOrder })
      .skip(skip)
      .limit(limitNum);
    
    // Format scans to match frontend expectations
    const formattedScans = scans.map(scan => ({
      id: scan._id,
      foodName: scan.foodName,
      status: scan.safetyStatus.toLowerCase(),
      reason: scan.analysis,
      tips: scan.tips || [],
      maxServing: scan.recommendedPortion,
      bestTime: scan.bestTimeToEat,
      alternatives: scan.alternatives || [],
      scannedAt: scan.scannedAt,
      inputType: scan.inputType || 'VALID_FOOD',
      triggerValue: scan.triggerValue || null
    }));
    
    const hasMore = skip + scans.length < total;
    
    // Get user for premium status
    const user = await User.findById(userId).select('subscription');
    const isPremium = user?.subscription === 'premium';
    
    // Get current scan status
    const scanStatus = await ScanLimitService.getScanStatus(userId, isPremium);
    
    res.json({
      success: true,
      scans: formattedScans,
      total,
      hasMore,
      page: pageNum,
      limit: limitNum,
      scanStatus
    });
    
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan history'
    });
  }
});

// Get single scan by ID - UPDATED to use controller which already includes fields
router.get('/:scanId', scanController.getScanById);

// Bulk delete scans by date range (MUST be before /:scanId DELETE route)
router.delete('/bulk', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }
    
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate || !startDate.trim() || !endDate.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }
    
    end.setHours(23, 59, 59, 999);
    
    const result = await Scan.deleteMany({
      userId,
      scannedAt: {
        $gte: start,
        $lte: end
      }
    });
    
    // Update user's total scans count
    await User.findByIdAndUpdate(userId, {
      $inc: { totalScans: -result.deletedCount }
    });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} scans deleted successfully`
    });
    
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete scans'
    });
  }
});

// Scan operations
router.delete('/:scanId', scanController.deleteScan);

// Scan limit management
router.post('/reset-limit', scanController.resetScanLimit);

// Status endpoint
router.get('/status/me', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
    }

    const user = await User.findById(userId).select('subscription');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const isPremium = user.subscription === 'premium';
    const scanStatus = await ScanLimitService.getScanStatus(userId, isPremium);

    res.json({
      success: true,
      scanStatus
    });

  } catch (error) {
    console.error('Scan status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch scan status' 
    });
  }
});

module.exports = router;