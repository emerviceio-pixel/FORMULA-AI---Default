// server/controllers/analyzerController.js
require('dotenv').config();
const User = require('../models/User');
const Scan = require('../models/Scan');
const scanLimits = require('../config/scanLimits');
const scanLimitService = require('../services/scanLimitService');
const RecommendationService = require('../services/RecommendationService');
const { decrypt: systemDecrypt } = require('../utils/encryption');

// Import AI Service instead of having local functions
const AIService = require('../services/AIService');

// Special keys for meal recommendations - THESE ARE THE ONLY MEAL TYPES SUPPORTED
const SPECIAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snack', 'fruit'];

// Helper function to get scan status
const getScanStatus = (user) => {
  const now = new Date();
  const lastReset = user.lastScanReset || now;
  const hoursSinceReset = (now - new Date(lastReset)) / (1000 * 60 * 60);
  const isPremium = user.subscription === 'premium';
  
  const resetHours = scanLimits.getResetHours(isPremium);
  const scanLimit = isPremium ? scanLimits.PREMIUM_SCAN_LIMIT : scanLimits.FREE_SCAN_LIMIT;
  
  if (hoursSinceReset >= resetHours) {
    return {
      scansUsed: 0,
      scanLimit: scanLimit === Infinity ? 'Unlimited' : scanLimit,
      remaining: scanLimit === Infinity ? 'Unlimited' : scanLimit,
      isPremium,
      resetIn: null,
      needsReset: true
    };
  }
  
  const scansUsed = user.dailyScans || 0;
  const remaining = scanLimit === Infinity ? 'Unlimited' : Math.max(0, scanLimit - scansUsed);
  
  const nextReset = new Date(lastReset.getTime() + (resetHours * 60 * 60 * 1000));
  const hoursUntilReset = (nextReset - now) / (1000 * 60 * 60);

  let resetDisplay = null;
  if (scansUsed >= scanLimit && scanLimit !== Infinity) {
    if (hoursUntilReset < 1) {
      const minutes = Math.ceil(hoursUntilReset * 60);
      resetDisplay = `${minutes} min${minutes > 1 ? 's' : ''}`;
    } else {
      const hrs = Math.ceil(hoursUntilReset);
      resetDisplay = `${hrs} hour${hrs > 1 ? 's' : ''}`;
    }
  }

  return {
    scansUsed,
    scanLimit: scanLimit === Infinity ? 'Unlimited' : scanLimit,
    remaining,
    isPremium,
    resetIn: resetDisplay,
    needsReset: false
  };
};

// ROBUST AI-based food validation function - handles ALL cases
async function validateFoodWithAI(input, user) {
  const prompt = `
You are a strict food input validator. Analyze this user input: "${input}"

Your task is to classify this input into EXACTLY ONE of these categories:

**CATEGORIES:**
1. **VALID_FOOD** - A specific, identifiable food item or dish
   - Examples: "pizza", "apple", "chicken soup", "greek yogurt with banana cake", "rice and beans", "burger", "sushi", "pasta", "salad"
   
2. **RESTAURANT** - A restaurant, cafe, or food establishment name
   - Examples: "mcdonalds", "kfc", "pizza hut", "starbucks", "chipotle", "burger king"
   
3. **SPECIAL_KEY** - ONLY these exact meal times: "breakfast", "lunch", "dinner", "snack", "fruit"
   - If user enters ANY other meal-related term (e.g., "smoothie", "alcohol", "dessert", "brunch", "appetizer", "beverage", "drink", "cocktail", "wine", "beer", "milkshake", "juice", "soda", "coffee", "tea"), do NOT classify as SPECIAL_KEY
   
4. **MEAL_TYPE_INVALID** - Meal-related terms that are NOT in the special keys list
   - Examples: "smoothie", "alcohol", "dessert", "brunch", "appetizer", "beverage", "drink", "cocktail", "wine", "beer", "milkshake", "juice", "soda", "coffee", "tea", "starter", "main course", "side dish"
   - For these, you will return a helpful message directing users to use special keys
   
5. **SUGGESTION** - A misspelled food item that needs correction
   - Examples: "pzza" → "pizza", "appple" → "apple", "chikin" → "chicken"
   
6. **UNCLEAR** - Vague, conversational, or unclear inputs
   - Examples: "I am hungry", "what should I eat", "recommend something", "I'm tired", "tell me what to eat", "something good", "anything tasty"
   
7. **INVALID** - Completely unrelated to food
   - Examples: "car", "phone", "computer", "weather", "politics", "sports"

**CRITICAL RULES:**
- SPECIAL_KEY is ONLY for "breakfast", "lunch", "dinner", "snack", "fruit" (exact matches)
- If user enters "smoothie", "alcohol", "dessert", etc. → MEAL_TYPE_INVALID
- If user is ASKING for a recommendation or expressing a feeling → UNCLEAR
- If input contains question words (what, how, can, should) → UNCLEAR
- If input is a complete sentence or has more than 4 words and isn't clearly a food name → UNCLEAR
- Be STRICT with classifications

User context:
- Country: ${user.country || 'Unknown'}
- Common local foods: Jollof, Waakye, Banku, Fufu, Kenkey

**RESPOND WITH ONLY THIS JSON FORMAT (no markdown, no extra text):**
{
  "validation": "VALID_FOOD|RESTAURANT|SPECIAL_KEY|MEAL_TYPE_INVALID|SUGGESTION|UNCLEAR|INVALID",
  "suggestedCorrection": "only if validation is SUGGESTION, otherwise null",
  "confidence": "HIGH|MEDIUM|LOW",
  "reason": "Brief 1-sentence explanation"
}`;

  try {
    const result = await AIService.callGeminiAPI(prompt, input, false);
    
    if (!result || !result.validation) {
      throw new Error('Invalid AI response structure');
    }
    
    const allowedValidations = ['VALID_FOOD', 'RESTAURANT', 'SPECIAL_KEY', 'MEAL_TYPE_INVALID', 'SUGGESTION', 'UNCLEAR', 'INVALID'];
    if (!allowedValidations.includes(result.validation)) {
      console.warn(`Unexpected validation value: ${result.validation}, defaulting to UNCLEAR`);
      return {
        validation: 'UNCLEAR',
        suggestedCorrection: null,
        confidence: 'LOW',
        reason: 'AI returned unexpected value, defaulting to unclear'
      };
    }
    
    return result;
  } catch (error) {
    console.error('AI validation error:', error);
    return {
      validation: 'UNCLEAR',
      suggestedCorrection: null,
      confidence: 'LOW',
      reason: 'AI validation service unavailable'
    };
  }
}

const analyzerController = {
  async analyzeFood(req, res) {
    try {
      const { foodName } = req.body;
      const userId = req.session.userId;

      if (!foodName?.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Please enter a food item, meal type, or restaurant name',
          type: 'INVALID_INPUT'
        });
      }

      const user = await User.findById(userId)
        .select('+healthConditionsSystemEncrypted +allergiesSystemEncrypted +manualFoodHistory +recommendedFoodHistory subscription country dietaryGoal bmiCategory activityLevel dateOfBirth dailyScans lastScanReset totalScans');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found',
          type: 'INVALID'
        });
      }

      const isPremium = user.subscription === 'premium';
      const normalizedInput = foodName.toLowerCase().trim();
      
      // STEP 1: Quick check for exact special key match (case insensitive)
      if (SPECIAL_KEYS.includes(normalizedInput)) {
        // Special key - premium feature check
        if (!isPremium) {
          return res.status(402).json({
            success: false,
            error: `${foodName} recommendations are a premium feature. Upgrade to get personalized ${foodName} suggestions based on your health profile.`,
            type: 'PREMIUM_REQUIRED',
            upgrade: true,
            specialKey: foodName
          });
        }
        
        // Process special key directly (skip AI validation for exact matches)
        console.log(`[Special Key] Processing: "${foodName}"`);
        return await processSpecialKey(req, res, user, foodName, isPremium);
      }
      
      // STEP 2: AI validates everything else
      console.log(`[AI Validation] Processing input: "${foodName}"`);
      const aiValidation = await validateFoodWithAI(foodName, user);
      console.log(`[AI Validation] Result:`, aiValidation);
      
      // STEP 3: Handle based on AI validation
      switch (aiValidation.validation) {
        case 'INVALID':
          return res.status(400).json({
            success: false,
            error: `"${foodName}" doesn't appear to be food-related. Please enter a specific food item or restaurant name.`,
            type: 'INVALID',
            aiValidation: true,
            suggestion: 'Try: "pizza", "grilled chicken", "mcdonalds", or "fruit"'
          });
          
        case 'SUGGESTION':
          return res.status(400).json({
            success: false,
            error: `Did you mean "${aiValidation.suggestedCorrection}"?`,
            type: 'SUGGESTION',
            suggestedCorrection: aiValidation.suggestedCorrection,
            originalInput: foodName,
            aiValidation: true
          });
          
        case 'MEAL_TYPE_INVALID':
          return res.status(400).json({
            success: false,
            error: `"${foodName}" is not supported. Try our special keys: Breakfast, Lunch, Dinner, Snack, or Fruit.`,
            type: 'MEAL_TYPE_INVALID',
            aiValidation: true,
            suggestion: `Try "breakfast", "lunch", "dinner", "snack", or "fruit" instead of "${foodName}"`,
            validSpecialKeys: SPECIAL_KEYS
          });
          
        case 'UNCLEAR':
          return res.status(400).json({
            success: false,
            error: aiValidation.reason || 'Please be more specific. Enter a food name (e.g., "pizza"), restaurant (e.g., "mcdonalds"), or use our special keys',
            type: 'UNCLEAR',
            aiValidation: true,
            confidence: aiValidation.confidence,
            suggestion: 'Try: "grilled chicken", "starbucks", "breakfast", or "fruit"'
          });
          
        case 'RESTAURANT':
          // Premium feature check for restaurants
          if (!isPremium) {
            return res.status(402).json({
              success: false,
              error: 'Restaurant analysis is a premium feature. Upgrade to get personalized menu recommendations from restaurants.',
              type: 'PREMIUM_REQUIRED',
              upgrade: true
            });
          }
          return await processRestaurant(req, res, user, foodName, isPremium, aiValidation);
          
        case 'VALID_FOOD':
          return await processValidFood(req, res, user, foodName, isPremium, aiValidation);
          
        case 'SPECIAL_KEY':
          // This case should rarely happen since we check exact matches first
          // But handle it just in case
          if (!isPremium) {
            return res.status(402).json({
              success: false,
              error: `${foodName} recommendations are a premium feature. Upgrade to get personalized suggestions.`,
              type: 'PREMIUM_REQUIRED',
              upgrade: true
            });
          }
          return await processSpecialKey(req, res, user, foodName, isPremium);
          
        default:
          console.error(`Unexpected validation value: ${aiValidation.validation}`);
          return res.status(400).json({
            success: false,
            error: 'Unable to process your request. Please try a specific food name or use our special keys: Breakfast, Lunch, Dinner, Snack, or Fruit.',
            type: 'UNCLEAR',
            aiValidation: true
          });
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      
      if (error.message?.includes('inputType') && error.message?.includes('enum')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input type. Please try a specific food name.',
          type: 'VALIDATION_ERROR'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'An error occurred during analysis. Please try again.',
        type: 'ERROR',
        scan: {
          foodName: req.body.foodName,
          status: 'Cautious',
          reason: 'Unable to analyze at this moment. Please try again.',
          tips: ['Try again', 'Use specific food names', 'Try: breakfast, lunch, dinner, snack, or fruit'],
          maxServing: '-',
          bestTime: '-',
          alternatives: [],
          scannedAt: new Date()
        }
      });
    }
  }
};

// Helper function to process valid food items
async function processValidFood(req, res, user, foodName, isPremium, aiValidation) {
  const inputType = 'VALID_FOOD';
  
  // Check scan limits
  const { limit: scanLimitRecord } = await ScanLimitService.checkAndResetLimit(user._id, isPremium);
  const scanLimit = scanLimits.getScanLimit(isPremium);
  
  if (scanLimit !== Infinity && scanLimitRecord.scansUsed >= scanLimit) {
    const status = await ScanLimitService.getScanStatus(user._id, isPremium);
    return res.status(429).json({
      success: false,
      error: `Daily scan limit reached. Please try again in ${status.resetIn || 'a few hours'}.`,
      type: 'SCAN_LIMIT_REACHED',
      upgrade: !isPremium
    });
  }
  
  // Get AI analysis
  let aiResponse;
  try {
    aiResponse = await AIService.analyzeFoodItem(foodName, user);
  } catch (aiError) {
    console.error('AI analysis error:', aiError);
    aiResponse = {
      status: 'CAUTIOUS',
      reason: 'Analysis temporarily unavailable. Using general guidance.',
      tips: ['Consult with a healthcare professional', 'Practice portion control'],
      maxServing: 'Moderate portion',
      bestTime: 'As part of a balanced meal',
      alternatives: [],
      foodName: foodName
    };
  }
  
  // Save to history
  user.manualFoodHistory = [
    foodName,
    ...(user.manualFoodHistory || []).filter(item => item !== foodName)
  ].slice(0, 15);
  
  // Handle alternatives
  let finalAlternatives = [];
  const status = aiResponse.status?.toUpperCase();
  if (isPremium || status === 'CAUTIOUS' || status === 'UNSAFE') {
    finalAlternatives = aiResponse.alternatives || [];
  }
  
  // Increment scan count
  const updatedLimit = await ScanLimitService.incrementScan(user._id, isPremium);
  
  // Save scan record
  const scan = new Scan({
    userId: user._id,
    foodName: aiResponse.foodName || foodName,
    safetyStatus: status || 'CAUTIOUS',
    analysis: aiResponse.reason || 'Analysis completed',
    tips: aiResponse.tips || ['Enjoy in moderation'],
    recommendedPortion: aiResponse.maxServing || 'Standard serving',
    bestTimeToEat: aiResponse.bestTime || 'Any time',
    alternatives: finalAlternatives,
    scannedAt: new Date(),
    inputType: inputType,
    triggerValue: null
  });
  
  await scan.save();
  
  // Update user
  user.dailyScans = updatedLimit.scansUsed;
  user.totalScans = (user.totalScans || 0) + 1;
  if (updatedLimit.scansUsed === 1 || updatedLimit.limitReachedAt) {
    user.lastScanReset = updatedLimit.limitReachedAt || new Date();
  }
  await user.save();
  
  const scanStatus = await ScanLimitService.getScanStatus(user._id, isPremium);
  
  res.json({
    success: true,
    type: inputType,
    aiValidation: {
      confidence: aiValidation?.confidence,
      reason: aiValidation?.reason
    },
    scan: {
      id: scan._id,
      foodName: scan.foodName,
      status: scan.safetyStatus,
      reason: scan.analysis,
      tips: scan.tips,
      maxServing: scan.recommendedPortion,
      bestTime: scan.bestTimeToEat,
      alternatives: scan.alternatives,
      scannedAt: scan.scannedAt,
      inputType: inputType
    },
    scanStatus: {
      scansUsed: scanStatus.scansUsed,
      scanLimit: scanStatus.scanLimit,
      remaining: scanStatus.remaining,
      isPremium: scanStatus.isPremium,
      resetIn: scanStatus.resetIn,
      limitReached: scanStatus.limitReached
    }
  });
}

// Helper function to process restaurant requests
async function processRestaurant(req, res, user, foodName, isPremium, aiValidation) {
  const inputType = 'RESTAURANT_NAME';
  
  // Check scan limits
  const { limit: scanLimitRecord } = await ScanLimitService.checkAndResetLimit(user._id, isPremium);
  const scanLimit = scanLimits.getScanLimit(isPremium);
  
  if (scanLimit !== Infinity && scanLimitRecord.scansUsed >= scanLimit) {
    const status = await ScanLimitService.getScanStatus(user._id, isPremium);
    return res.status(429).json({
      success: false,
      error: `Daily scan limit reached. Please try again in ${status.resetIn || 'a few hours'}.`,
      type: 'SCAN_LIMIT_REACHED',
      upgrade: !isPremium
    });
  }
  
  // Get AI analysis for restaurant
  let aiResponse;
  try {
    aiResponse = await AIService.analyzeRestaurant(foodName, user);
  } catch (aiError) {
    console.error('AI analysis error:', aiError);
    aiResponse = {
      status: 'CAUTIOUS',
      reason: 'Analysis temporarily unavailable.',
      tips: ['Check restaurant nutrition info', 'Ask about preparation methods'],
      maxServing: 'Standard portion',
      bestTime: 'As part of balanced eating',
      alternatives: [],
      foodName: foodName
    };
  }
  
  // Save to history
  const menuItemToSave = aiResponse.foodName || foodName;
  user.recommendedFoodHistory = [
    menuItemToSave,
    ...(user.recommendedFoodHistory || []).filter(item => item !== menuItemToSave)
  ].slice(0, 15);
  
  // Handle alternatives
  let finalAlternatives = [];
  const status = aiResponse.status?.toUpperCase();
  if (isPremium || status === 'CAUTIOUS' || status === 'UNSAFE') {
    finalAlternatives = aiResponse.alternatives || [];
  }
  
  // Increment scan count
  const updatedLimit = await ScanLimitService.incrementScan(user._id, isPremium);
  
  // Save scan record
  const scan = new Scan({
    userId: user._id,
    foodName: aiResponse.foodName || foodName,
    safetyStatus: status || 'CAUTIOUS',
    analysis: aiResponse.reason || 'Analysis completed',
    tips: aiResponse.tips || ['Check nutrition info', 'Ask for modifications'],
    recommendedPortion: aiResponse.maxServing || 'Standard serving',
    bestTimeToEat: aiResponse.bestTime || 'Any time',
    alternatives: finalAlternatives,
    scannedAt: new Date(),
    inputType: inputType,
    triggerValue: foodName
  });
  
  await scan.save();
  
  // Track recommendation
  try {
    await RecommendationService.trackRecommendation(
      user._id,
      inputType,
      foodName,
      aiResponse.foodName,
      aiResponse.status || 'SAFE',
      scan._id,
      aiResponse.price || null,
      aiResponse.isCombinationMeal || false
    );
  } catch (trackError) {
    console.error('Error tracking recommendation:', trackError);
  }
  
  // Update user
  user.dailyScans = updatedLimit.scansUsed;
  user.totalScans = (user.totalScans || 0) + 1;
  if (updatedLimit.scansUsed === 1 || updatedLimit.limitReachedAt) {
    user.lastScanReset = updatedLimit.limitReachedAt || new Date();
  }
  await user.save();
  
  const scanStatus = await ScanLimitService.getScanStatus(user._id, isPremium);
  
  res.json({
    success: true,
    type: inputType,
    aiValidation: {
      confidence: aiValidation?.confidence,
      reason: aiValidation?.reason
    },
    scan: {
      id: scan._id,
      foodName: scan.foodName,
      status: scan.safetyStatus,
      reason: scan.analysis,
      tips: scan.tips,
      maxServing: scan.recommendedPortion,
      bestTime: scan.bestTimeToEat,
      alternatives: scan.alternatives,
      scannedAt: scan.scannedAt,
      inputType: inputType,
      triggerValue: foodName
    },
    scanStatus: {
      scansUsed: scanStatus.scansUsed,
      scanLimit: scanStatus.scanLimit,
      remaining: scanStatus.remaining,
      isPremium: scanStatus.isPremium,
      resetIn: scanStatus.resetIn,
      limitReached: scanStatus.limitReached
    }
  });
}

// Helper function to process special keys (breakfast, lunch, dinner, snack, fruit)
async function processSpecialKey(req, res, user, foodName, isPremium) {
  const inputType = 'SPECIAL_KEY';
  
  // Check scan limits
  const { limit: scanLimitRecord } = await ScanLimitService.checkAndResetLimit(user._id, isPremium);
  const scanLimit = scanLimits.getScanLimit(isPremium);
  
  if (scanLimit !== Infinity && scanLimitRecord.scansUsed >= scanLimit) {
    const status = await ScanLimitService.getScanStatus(user._id, isPremium);
    return res.status(429).json({
      success: false,
      error: `Daily scan limit reached. Please try again in ${status.resetIn || 'a few hours'}.`,
      type: 'SCAN_LIMIT_REACHED',
      upgrade: !isPremium
    });
  }
  
  // Get AI recommendation for the meal type
  let aiResponse;
  try {
    aiResponse = await AIService.generateRecommendation(foodName, user);
  } catch (aiError) {
    console.error('AI recommendation error:', aiError);
    aiResponse = {
      status: 'SAFE',
      reason: `Personalized ${foodName} recommendations available with premium.`,
      tips: ['Eat balanced meals', 'Stay hydrated', 'Listen to your body'],
      maxServing: 'Appropriate portion',
      bestTime: `Optimal for ${foodName}`,
      alternatives: [],
      foodName: `Recommended ${foodName} option`
    };
  }
  
  // Save to history
  const foodNameToSave = aiResponse.foodName || `${foodName} recommendation`;
  user.recommendedFoodHistory = [
    foodNameToSave,
    ...(user.recommendedFoodHistory || []).filter(item => item !== foodNameToSave)
  ].slice(0, 15);
  
  // Handle alternatives
  let finalAlternatives = [];
  const status = aiResponse.status?.toUpperCase();
  if (isPremium || status === 'CAUTIOUS' || status === 'UNSAFE') {
    finalAlternatives = aiResponse.alternatives || [];
  }
  
  // Increment scan count
  const updatedLimit = await ScanLimitService.incrementScan(user._id, isPremium);
  
  // Save scan record
  const scan = new Scan({
    userId: user._id,
    foodName: aiResponse.foodName || `${foodName} recommendation`,
    safetyStatus: status || 'SAFE',
    analysis: aiResponse.reason || `Personalized ${foodName} recommendations based on your profile`,
    tips: aiResponse.tips || [`Enjoy a balanced ${foodName}`, 'Include variety in your meals'],
    recommendedPortion: aiResponse.maxServing || 'Appropriate portion size',
    bestTimeToEat: aiResponse.bestTime || `During ${foodName} time`,
    alternatives: finalAlternatives,
    scannedAt: new Date(),
    inputType: inputType,
    triggerValue: foodName
  });
  
  await scan.save();
  
  // Track recommendation
  try {
    await RecommendationService.trackRecommendation(
      user._id,
      inputType,
      foodName,
      aiResponse.foodName,
      aiResponse.status || 'SAFE',
      scan._id,
      null,
      false
    );
  } catch (trackError) {
    console.error('Error tracking recommendation:', trackError);
  }
  
  // Update user
  user.dailyScans = updatedLimit.scansUsed;
  user.totalScans = (user.totalScans || 0) + 1;
  if (updatedLimit.scansUsed === 1 || updatedLimit.limitReachedAt) {
    user.lastScanReset = updatedLimit.limitReachedAt || new Date();
  }
  await user.save();
  
  const scanStatus = await ScanLimitService.getScanStatus(user._id, isPremium);
  
  res.json({
    success: true,
    type: inputType,
    specialKey: foodName,
    scan: {
      id: scan._id,
      foodName: scan.foodName,
      status: scan.safetyStatus,
      reason: scan.analysis,
      tips: scan.tips,
      maxServing: scan.recommendedPortion,
      bestTime: scan.bestTimeToEat,
      alternatives: scan.alternatives,
      scannedAt: scan.scannedAt,
      inputType: inputType,
      triggerValue: foodName
    },
    scanStatus: {
      scansUsed: scanStatus.scansUsed,
      scanLimit: scanStatus.scanLimit,
      remaining: scanStatus.remaining,
      isPremium: scanStatus.isPremium,
      resetIn: scanStatus.resetIn,
      limitReached: scanStatus.limitReached
    }
  });
}

module.exports = analyzerController;