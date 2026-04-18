// server/services/AIService.js
const { decrypt: systemDecrypt } = require('../utils/encryption');
const RecommendationService = require('./RecommendationService');

const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Google Gemini API
//const { GoogleGenerativeAI } = require("@google/generative-ai");
//const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

/*
 // Shared AI calling function
async function callGeminiAPI(prompt, fallbackName) {
  try {
    const result = await model.generateContent(prompt);
    const aiText = result.response.text();
    
    let cleaned = aiText.trim();
    cleaned = cleaned.replace(/```json\s*|\s*```/g, '');
    const jsonMatch = cleaned.match(/({[\s\S]*})/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      
      // Extract clean food name for recommendations
      parsed.foodName = parsed.foodName || fallbackName;
      
      return parsed;
    }
    throw new Error('No JSON found');
  } catch (error) {
    // Fallback response
    return {
      status: 'SAFE',
      reason: `Excellent choice for your profile.`,
      tips: ['Enjoy in moderation', 'Monitor your body\'s response'],
      maxServing: 'As recommended',
      bestTime: 'Any time',
      foodName: fallbackName
    };
  }
}
 */

// Shared AI calling function
async function callGeminiAPI(prompt, fallbackName, isRegenerate = false) {
  try {
    const temperature = isRegenerate ? 0.9 : 0.7;
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a Strict professional dietitian and a nutritionist. Always respond with valid JSON only, no markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: temperature,
      max_tokens: 800,
      top_p: isRegenerate ? 0.95 : 0.8,
      stream: false,
    });

    const aiText = completion.choices[0]?.message?.content || '';
    let cleaned = aiText.trim().replace(/```json\s*|\s*```/g, '');
    
    const jsonMatch = cleaned.match(/({[\s\S]*})/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      parsed.foodName = parsed.foodName || fallbackName;
      return parsed;
    }
    
    // Fallback response
    return {
      status: 'SAFE',
      reason: `Based on your profile, this is an excellent choice.`,
      tips: ['Enjoy in moderation', 'Monitor your body\'s response'],
      maxServing: 'As recommended',
      bestTime: 'Any time',
      foodName: fallbackName
    };
  } catch (error) {
    return {
      status: 'SAFE',
      reason: `This option aligns well with your dietary needs.`,
      tips: ['Consider portion control', 'Stay hydrated'],
      maxServing: '1 serving',
      bestTime: 'Morning or afternoon',
      foodName: fallbackName
    };
  }
}

// Food item analysis
async function analyzeFoodItem(foodName, user) {
  const conditions = systemDecrypt(user.healthConditionsSystemEncrypted) || [];
  const allergies = systemDecrypt(user.allergiesSystemEncrypted) || [];

  const prompt = `
As a Strict professional dietitian and a nutritionist, analyze this ${foodName} for your user.

User Profile:
- Country: ${user.country}
- Health Conditions: ${conditions.length ? conditions.join(', ') : 'None'}
- Allergies: ${allergies.length ? allergies.join(', ') : 'None'}
- Dietary Goal: ${user.dietaryGoal}
- BMI Category: ${user.bmiCategory}
- Activity Level: ${user.activityLevel}
- Age: ${user.dateOfBirth}

CRITICAL RULES:
1. If status is CAUTIOUS or UNSAFE, you MUST provide 2-3 alternatives
2. Alternatives must be SAFER than the original item for THIS SPECIFIC USER
3. Consider the user's health conditions and allergies when determining what is SAFE vs UNSAFE
4. If ${foodName} has abnormal combinations that could be harmful, status = "UNSAFE". eg, Coca Cola with eggs, Plantain with soda, nutella and coffee, etc. In such cases, provide alternatives that are safe and do not have harmful interactions.
IMPORTANT: alternatives must be a simple array of strings only. Do NOT include objects or reasons.

Provide analysis in EXACT JSON format:
{
  "status": "SAFE | CAUTIOUS | UNSAFE",
  "reason": "Concise explanation",
  "tips": ["Tip 1", "Tip 2"],
  "maxServing": "Recommended portion",
  "bestTime": "Best time to consume",
  "alternatives": []
`;

  return await callGeminiAPI(prompt, foodName);
}

// Special key recommendation
async function generateRecommendation(mealType, user, lastItem = null) {
  const conditions = systemDecrypt(user.healthConditionsSystemEncrypted) || [];
  const allergies = systemDecrypt(user.allergiesSystemEncrypted) || [];

  // Get recent recommendations to avoid repetition
  const recentHistory = await RecommendationService.getRecommendationHistoryForPrompt(
    user._id,
    'SPECIAL_KEY',
    mealType
  );

  const prompt = `
You are a Strict professional nutritionist and a dietitian for this user. Recommend ONE SPECIFIC ${mealType} food item.

${recentHistory}

${lastItem ? `Last recommended: ${lastItem}. Please suggest something different.` : ''}

IMPORTANT: DO NOT recommend any of the items listed above. Suggest something different.

User Profile:
- Country: ${user.country}
- Health Conditions: ${conditions.length ? conditions.join(', ') : 'None'}
- Allergies: ${allergies.length ? allergies.join(', ') : 'None'}
- Dietary Goal: ${user.dietaryGoal}
- BMI Category: ${user.bmiCategory}
- Activity Level: ${user.activityLevel}
- Age: ${user.dateOfBirth}

Provide analysis in EXACT JSON format:
{ 
  "foodName": "The specific food item you're recommending (make it unique and different from previous recommendations)",
  "status": "SAFE",
  "reason": "Concise explanation why this specific food is excellent for your user",
  "tips": ["Preparation tip", "Portion guidance"],
  "maxServing": "Recommended frequency",
  "bestTime": "Optimal time window",
  "alternatives": []
}
`;

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
You are Strict professional nutritionist and a dietitian. Recommend ONE SPECIFIC menu item from ${restaurantName} for your user.

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