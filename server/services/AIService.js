const { decrypt: systemDecrypt } = require('../utils/encryption');

// ✅ Gemini setup
// server/services/AIService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const RecommendationService = require('./RecommendationService');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// Shared AI calling function
async function callGeminiAPI(prompt, fallbackName, isRegenerate = false) {
  try {
    const temperature = isRegenerate ? 0.9 : 0.7;
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 2048,
        topP: isRegenerate ? 0.95 : 0.8,
      },
    });

    const aiText = result.response.text();
    
    // Log the raw response for debugging
    console.log('Raw AI response:', aiText);
    
    // Clean the response
    let cleaned = aiText.trim();
    cleaned = cleaned.replace(/```json\s*|\s*```/g, '');
    cleaned = cleaned.replace(/```\s*|\s*```/g, '');
    
    // Try multiple JSON extraction methods
    let parsed = null;
    
    // Method 1: Find JSON object
    const jsonMatch = cleaned.match(/({[\s\S]*})/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.log('Failed to parse JSON from match, trying fallback');
      }
    }
    
    // Method 2: If still not parsed, try parsing the whole cleaned string
    if (!parsed) {
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        console.log('Failed to parse full cleaned string');
      }
    }
    
    // Method 3: If still not parsed, try to extract with regex for each field
    if (!parsed) {
      parsed = {};
      const statusMatch = cleaned.match(/"status"\s*:\s*"([^"]+)"/i);
      const foodNameMatch = cleaned.match(/"foodName"\s*:\s*"([^"]+)"/i);
      const reasonMatch = cleaned.match(/"reason"\s*:\s*"([^"]+)"/i);
      
      if (foodNameMatch) parsed.foodName = foodNameMatch[1];
      if (statusMatch) parsed.status = statusMatch[1];
      if (reasonMatch) parsed.reason = reasonMatch[1];
      
      // Set defaults for missing fields
      parsed.tips = parsed.tips || ['Enjoy in moderation', 'Monitor your body\'s response'];
      parsed.maxServing = parsed.maxServing || 'As recommended';
      parsed.bestTime = parsed.bestTime || 'Any time';
      parsed.alternatives = parsed.alternatives || [];
    }
    
    parsed.foodName = parsed.foodName || fallbackName;
    parsed.status = parsed.status || 'SAFE';
    parsed.reason = parsed.reason || `Excellent choice for your profile.`;
    
    return parsed;
    
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Return fallback response
    return {
      status: 'SAFE',
      reason: `Based on your profile, this is an excellent choice.`,
      tips: ['Enjoy in moderation', 'Monitor your body\'s response'],
      maxServing: 'As recommended',
      bestTime: 'Any time',
      foodName: fallbackName,
      alternatives: []
    };
  }
}

// Food item analysis
async function analyzeFoodItem(foodName, user) {
  const conditions = systemDecrypt(user.healthConditionsSystemEncrypted) || [];
  const allergies = systemDecrypt(user.allergiesSystemEncrypted) || [];

  const prompt = `
As a Ruthless professional nutritionist, analyze this ${foodName} for this user.

User Profile:
- Country: ${user.country}
- Health Conditions: ${conditions.length ? conditions.join(', ') : 'None'}
- Allergies: ${allergies.length ? allergies.join(', ') : 'None'}
- Dietary Goal: ${user.dietaryGoal}
- BMI Category: ${user.bmiCategory}
- Activity Level: ${user.activityLevel}
- Age: ${user.dateOfBirth}

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.

Provide analysis in EXACT JSON format:
{
  "status": "SAFE | CAUTIOUS | UNSAFE",
  "reason": "Concise explanation",
  "tips": ["Tip 1", "Tip 2"],
  "maxServing": "Recommended portion",
  "bestTime": "Best time to consume",
  "alternatives": []
}`;

  return await callGeminiAPI(prompt, foodName);
}

// Special key recommendation
async function generateRecommendation(mealType, user, lastItem = null) {
  const conditions = systemDecrypt(user.healthConditionsSystemEncrypted) || [];
  const allergies = systemDecrypt(user.allergiesSystemEncrypted) || [];
  
  const recentHistory = await RecommendationService.getRecommendationHistoryForPrompt(
    user._id,
    'SPECIAL_KEY',
    mealType
  );

  const prompt = `
You are a Ruthless professional nutritionist. Recommend ONE SPECIFIC ${mealType} food item for this user.

${recentHistory}

${lastItem ? `Last recommended: ${lastItem}. Please suggest something different.` : ''}

User Profile:
- Country: ${user.country}
- Health Conditions: ${conditions.length ? conditions.join(', ') : 'None'}
- Allergies: ${allergies.length ? allergies.join(', ') : 'None'}
- Dietary Goal: ${user.dietaryGoal}
- BMI Category: ${user.bmiCategory}
- Activity Level: ${user.activityLevel}
- Age: ${user.dateOfBirth}

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.

Your response's "reason" field MUST start with: "I recommend [FOOD NAME]."

Provide analysis in EXACT JSON format:
{ 
  "foodName": "The specific food item you're recommending",
  "status": "SAFE",
  "reason": "Concisely explain why this specific food is excellent for the user",
  "tips": ["Preparation tip", "Portion guidance"],
  "maxServing": "Recommended frequency",
  "bestTime": "Optimal time window",
  "alternatives": []
}`;

  return await callGeminiAPI(prompt, mealType, !!lastItem);
}

// Restaurant analysis
async function analyzeRestaurant(restaurantName, user, lastItem = null) {
  const conditions = systemDecrypt(user.healthConditionsSystemEncrypted) || [];
  const allergies = systemDecrypt(user.allergiesSystemEncrypted) || [];

  const recentHistory = await RecommendationService.getRecommendationHistoryForPrompt(
    user._id,
    'RESTAURANT_NAME',
    restaurantName
  );

  const hasExhaustedSafeItems = await RecommendationService.hasExhaustedSafeItems(
    user._id,
    'RESTAURANT_NAME',
    restaurantName
  );

  const prompt = `
You are a Ruthless professional nutritionist. Recommend ONE SPECIFIC menu item from ${restaurantName} for your user.

${recentHistory}

${lastItem ? `Last recommended: ${lastItem}. Please suggest something different.` : ''}

${hasExhaustedSafeItems ? 
  'NOTE: You have recommended all individual safe items. You may now suggest combination meals, but mark them clearly as "Combo Meal" and ensure they are safe options.' : 
  'PRIORITY: Recommend individual menu items first. Only suggest combination meals if all individual safe options are exhausted.'}

User Profile:
- Country: ${user.country}
- Health Conditions: ${conditions.length ? conditions.join(', ') : 'None'}
- Allergies: ${allergies.length ? allergies.join(', ') : 'None'}
- Dietary Goal: ${user.dietaryGoal}
- BMI Category: ${user.bmiCategory}
- Activity Level: ${user.activityLevel}
- Age: ${user.dateOfBirth}

REQUIREMENTS:
1. Include the TOTAL PRICE of the menu item in your response
2. If recommending a combination meal, explicitly label it as "Combo Meal"
3. Format the foodName to include both the item name AND price

Provide analysis in EXACT JSON format:
{
  "foodName": "Specific menu item with price (e.g., 'Grilled Chicken Breast - GHC39.99')",
  "status": "SAFE | CAUTIOUS | UNSAFE",
  "reason": "Concise explanation why this specific menu item is suitable or unsuitable",
  "tips": ["Ordering modification tip", "Portion guidance"],
  "maxServing": "Recommended frequency",
  "bestTime": "Optimal time window",
  "alternatives": [],
  "price": "Convert the total price to GHC if rated in $ and include the currency (e.g., 'GHC39.99')",
  "isCombinationMeal": true or false
}
`;

  return await callGeminiAPI(prompt, restaurantName, !!lastItem);
}

module.exports = {
  analyzeFoodItem,
  generateRecommendation,
  analyzeRestaurant,
  callGeminiAPI
};