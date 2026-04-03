// server/routes/profile.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth, requirePinVerification } = require('../middleware/auth');

// Get user profile (masked basic info)
router.get('/', requireAuth, profileController.getProfile);

// Update full profile (including optional health data with key)
router.put('/', requireAuth, profileController.updateProfile);

// Get decrypted health conditions — requires PIN verification
router.get('/health-conditions', requireAuth, requirePinVerification, profileController.getHealthConditions);

// Get decrypted allergies — requires PIN verification
router.get('/allergies', requireAuth, requirePinVerification, profileController.getAllergies);

// Get predefined examples (for UI suggestions)
router.get('/examples', requireAuth, profileController.getPredefinedExamples);

// Helper: Calculate BMI without saving
router.post('/calculate-bmi', requireAuth, (req, res) => {
  try {
    const { height, weight } = req.body;
    
    if (!height || !weight) {
      return res.status(400).json({
        success: false,
        error: 'Height and weight are required'
      });
    }

    let heightInMeters, weightInKg;
    
    // Convert to metric if needed
    if (height.unit === 'cm') {
      heightInMeters = height.value / 100;
    } else {
      // Assume feet if not cm
      heightInMeters = height.value * 0.3048;
    }
    
    if (weight.unit === 'kg') {
      weightInKg = weight.value;
    } else {
      // Assume pounds if not kg
      weightInKg = weight.value * 0.453592;
    }
    
    const bmi = weightInKg / (heightInMeters * heightInMeters);
    const roundedBMI = parseFloat(bmi.toFixed(1));
    
    // Determine BMI category
    let bmiCategory;
    if (bmi < 18.5) {
      bmiCategory = 'underweight';
    } else if (bmi >= 18.5 && bmi < 25) {
      bmiCategory = 'normal';
    } else if (bmi >= 25 && bmi < 30) {
      bmiCategory = 'overweight';
    } else {
      bmiCategory = 'obese';
    }
    
    // Interpretation helper
    const getBMIInterpretation = (category) => {
      switch (category) {
        case 'underweight':
          return 'You may need to gain weight. Consider consulting a healthcare provider.';
        case 'normal':
          return 'Your weight is within the healthy range. Maintain your current lifestyle.';
        case 'overweight':
          return 'Consider adopting a healthier diet and increasing physical activity.';
        case 'obese':
          return 'Consult a healthcare provider for personalized weight management advice.';
        default:
          return '';
      }
    };

    res.json({
      success: true,
      bmi: roundedBMI,
      bmiCategory,
      interpretation: getBMIInterpretation(bmiCategory)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate BMI'
    });
  }
});

module.exports = router;