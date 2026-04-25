// server/controllers/profileController.js
const User = require('../models/User');
const { validateHealthData } = require('../shared/constants');
const { encrypt, decrypt } = require('../utils/encryption');

const profileController = {
  // Get user profile (masked)
  async getProfile(req, res) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Return masked profile (health data hidden until decrypted)
      const maskedProfile = {
        ...user.toObject(),
        healthConditions: [],
        allergies: [],
        hasHealthKey: false, // No longer used
        migratedToSystemKey: user.migratedToSystemKey || false
      };

      res.json({
        success: true,
        profile: maskedProfile
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  },

  // Update profile
  async updateProfile(req, res) {
    try {
      const userId = req.session.userId;
      const updates = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // VALIDATION: Check health conditions and allergies if provided
      if (updates.healthConditions || updates.allergies) {
        const conditionsToValidate = updates.healthConditions || [];
        const allergiesToValidate = updates.allergies || [];
        
        const validation = validateHealthData(conditionsToValidate, allergiesToValidate);
        
        if (!validation.isValid) {
          const errorMessages = [];
          if (validation.invalidConditions.length > 0) {
            errorMessages.push(`Unsupported health conditions: ${validation.invalidConditions.join(', ')}`);
          }
          if (validation.invalidAllergies.length > 0) {
            errorMessages.push(`Unsupported allergies: ${validation.invalidAllergies.join(', ')}`);
          }
          
          return res.status(400).json({
            success: false,
            error: 'Health data validation failed',
            details: {
              invalidConditions: validation.invalidConditions,
              invalidAllergies: validation.invalidAllergies,
              message: errorMessages.join('; ')
            }
          });
        }
      }

      // Basic info
      if (updates.nickname !== undefined) user.nickname = updates.nickname;
      if (updates.dateOfBirth !== undefined) user.dateOfBirth = updates.dateOfBirth;
      if (updates.country !== undefined) user.country = updates.country;

      if (updates.height) {
        user.height = updates.height;
        user.calculateBMI();
      }

      if (updates.weight) {
        user.weight = updates.weight;
        user.calculateBMI();
      }

      if (updates.dietaryGoal !== undefined) user.dietaryGoal = updates.dietaryGoal;
      if (updates.activityLevel !== undefined) user.activityLevel = updates.activityLevel;

      // Encrypt health conditions with system key
      if (updates.healthConditions !== undefined) {
        if (Array.isArray(updates.healthConditions) && updates.healthConditions.length > 0) {
          // Encrypt for user profile (using system key)
          const encrypted = encrypt(updates.healthConditions);
          user.healthConditions = encrypted;
          
          // Also encrypt for AI/system use
          const systemEncrypted = encrypt(updates.healthConditions);
          user.healthConditionsSystemEncrypted = systemEncrypted;
        } else {
          // Empty array - clear the data
          user.healthConditions = null;
          user.healthConditionsSystemEncrypted = null;
        }
      }

      // Encrypt allergies with system key
      if (updates.allergies !== undefined) {
        if (Array.isArray(updates.allergies) && updates.allergies.length > 0) {
          const encrypted = encrypt(updates.allergies);
          user.allergies = encrypted;
          
          const systemEncrypted = encrypt(updates.allergies);
          user.allergiesSystemEncrypted = systemEncrypted;
        } else {
          user.allergies = null;
          user.allergiesSystemEncrypted = null;
        }
      }

      // Mark as migrated if this is first save with system key
      if (!user.migratedToSystemKey && (updates.healthConditions || updates.allergies)) {
        user.migratedToSystemKey = true;
      }

      await user.save();

      // Return masked profile
      const maskedProfile = {
        ...user.toObject(),
        healthConditions: [],
        allergies: [],
        hasHealthKey: false,
        migratedToSystemKey: user.migratedToSystemKey
      };

      res.json({
        success: true,
        profile: maskedProfile,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  },

  // Get decrypted health conditions (no key required - uses system key)
  async getHealthConditions(req, res) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const user = await User.findById(userId).select('healthConditions migratedToSystemKey');
      if (!user) {
        return res.json({ success: true, conditions: [] });
      }
      
      // If no encrypted data exists
      if (!user.healthConditions) {
        return res.json({ success: true, conditions: [] });
      }
      
      // Decrypt using system key
      const decrypted = decrypt(user.healthConditions);
      
      res.json({
        success: true,
        conditions: Array.isArray(decrypted) ? decrypted : []
      });
      
    } catch (error) {
      console.error('Get health conditions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get health conditions'
      });
    }
  },

  // Get decrypted allergies (no key required - uses system key)
  async getAllergies(req, res) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Not authenticated'
        });
      }

      const user = await User.findById(userId).select('allergies migratedToSystemKey');
      if (!user) {
        return res.json({ success: true, allergies: [] });
      }
      
      // If no encrypted data exists
      if (!user.allergies) {
        return res.json({ success: true, allergies: [] });
      }
      
      // Decrypt using system key
      const decrypted = decrypt(user.allergies);
      
      res.json({
        success: true,
        allergies: Array.isArray(decrypted) ? decrypted : []
      });
      
    } catch (error) {
      console.error('Get allergies error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get allergies'
      });
    }
  },

  // Get predefined examples (for UI suggestions)
  async getPredefinedExamples(req, res) {
    try {
      const { HEALTH_CONDITIONS_ARRAY, ALLERGIES_ARRAY } = require('../constants');
      
      const getRandomSubset = (arr, count) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
      };

      const examples = {
        healthConditions: getRandomSubset(HEALTH_CONDITIONS_ARRAY, 12),
        allergies: getRandomSubset(ALLERGIES_ARRAY, 10)
      };

      res.json({
        success: true,
        examples
      });
    } catch (error) {
      console.error('Get examples error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get predefined examples'
      });
    }
  },

  // Helper: Calculate BMI without saving
  async calculateBMI(req, res) {
    try {
      const { height, weight } = req.body;
      
      if (!height || !weight) {
        return res.status(400).json({
          success: false,
          error: 'Height and weight are required'
        });
      }

      let heightInMeters, weightInKg;
      
      if (height.unit === 'cm') {
        heightInMeters = height.value / 100;
      } else {
        heightInMeters = height.value * 0.3048;
      }
      
      if (weight.unit === 'kg') {
        weightInKg = weight.value;
      } else {
        weightInKg = weight.value * 0.453592;
      }
      
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      const roundedBMI = parseFloat(bmi.toFixed(1));
      
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
      console.error('BMI calculation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate BMI'
      });
    }
  }
};

module.exports = profileController;