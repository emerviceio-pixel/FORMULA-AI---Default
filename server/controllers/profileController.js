const User = require('../models/User');
const bcrypt = require('bcryptjs');

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

      const user = await User.findById(userId).select('-pinHash -pinSalt -recoveryWordHash -recoveryWordSalt');
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Return masked profile
      const maskedProfile = {
        ...user.toObject(),
        healthConditions: [],
        allergies: [],
        hasHealthKey: user.hasHealthKey || false
      };

      res.json({
        success: true,
        profile: maskedProfile
      });
    } catch (error) {
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

      // Basic info
      if (updates.nickname) user.nickname = updates.nickname;
      if (updates.dateOfBirth) user.dateOfBirth = updates.dateOfBirth;
      if (updates.country) user.country = updates.country;

      if (updates.height) {
        user.height = updates.height;
        user.calculateBMI();
      }

      if (updates.weight) {
        user.weight = updates.weight;
        user.calculateBMI();
      }

      if (updates.dietaryGoal) user.dietaryGoal = updates.dietaryGoal;
      if (updates.activityLevel) user.activityLevel = updates.activityLevel;

      // Health key setup (first-time)
      if (updates.healthDataKey && !user.healthKeyHash) {
        const hash = await bcrypt.hash(updates.healthDataKey, 10);
        user.healthKeyHash = hash;
        user.hasHealthKey = true;
      }

      // Health data encryption (only if key provided)
      if (updates.healthConditions && updates.healthDataKey) {
        const encrypted = user.encryptHealthData(updates.healthConditions, updates.healthDataKey);
        user.healthConditions = encrypted;
      }

      if (updates.allergies && updates.healthDataKey) {
        const encrypted = user.encryptHealthData(updates.allergies, updates.healthDataKey);
        user.allergies = encrypted;
      }

      if (updates.healthConditions && updates.healthDataKey) {
        // 1. Encrypt with user's key (for profile editing)
        const userEncrypted = user.encryptHealthData(updates.healthConditions, updates.healthDataKey);
        user.healthConditions = userEncrypted; // This is your existing field

        // 2. Encrypt with SYSTEM key (for AI analysis)
        const { encrypt: systemEncrypt } = require('../utils/encryption');
        const systemEncrypted = systemEncrypt(updates.healthConditions);
        user.healthConditionsSystemEncrypted = systemEncrypted;
      }

      // Same for allergies
      if (updates.allergies && updates.healthDataKey) {
        const userEncrypted = user.encryptHealthData(updates.allergies, updates.healthDataKey);
        user.allergies = userEncrypted;
        
        const { encrypt: systemEncrypt } = require('../utils/encryption');
        const systemEncrypted = systemEncrypt(updates.allergies);
        user.allergiesSystemEncrypted = systemEncrypted;
      }

      await user.save();

      // Return masked profile
      const maskedProfile = {
        ...user.toObject(),
        healthConditions: [],
        allergies: [],
        hasHealthKey: user.hasHealthKey || false
      };

      res.json({
        success: true,
        profile: maskedProfile,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  },

  // Get decrypted health conditions (for user editing)
  async getHealthConditions(req, res) {
    try {
      const userId = req.session.userId;
      const { key } = req.query;

      if (!userId || !key) {
        return res.status(401).json({
          success: false,
          error: 'Missing credentials'
        });
      }

      const user = await User.findById(userId).select('healthConditions healthKeyHash');
      if (!user || !user.healthConditions) {
        return res.json({
          success: true,
          conditions: []
        });
      }

      // Verify key
      const isValid = await bcrypt.compare(key, user.healthKeyHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid health key'
        });
      }

      const decrypted = user.decryptHealthData(user.healthConditions, key);
      if (decrypted === null) {
        return res.status(400).json({
          success: false,
          error: 'Decryption failed'
        });
      }

      res.json({
        success: true,
        conditions: decrypted
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get health conditions'
      });
    }
  },

  // Get decrypted allergies (for user editing)
  async getAllergies(req, res) {
    try {
      const userId = req.session.userId;
      const { key } = req.query;

      if (!userId || !key) {
        return res.status(401).json({
          success: false,
          error: 'Missing credentials'
        });
      }

      const user = await User.findById(userId).select('allergies healthKeyHash');
      if (!user || !user.allergies) {
        return res.json({
          success: true,
          allergies: []
        });
      }

      const isValid = await bcrypt.compare(key, user.healthKeyHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid health key'
        });
      }

      const decrypted = user.decryptHealthData(user.allergies, key);
      if (decrypted === null) {
        return res.status(400).json({
          success: false,
          error: 'Decryption failed'
        });
      }

      res.json({
        success: true,
        allergies: decrypted
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get allergies'
      });
    }
  },

  // Setup health key (new users)
  async setupHealthKey(req, res) {
    try {
      const userId = req.session.userId;
      const { healthKey } = req.body;

      if (!userId || !healthKey) {
        return res.status(400).json({
          success: false,
          error: 'Health key is required'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Hash and store health key
      const hash = await bcrypt.hash(healthKey, 10);
      user.healthKeyHash = hash;
      user.hasHealthKey = true;
      await user.save();

      res.json({
        success: true,
        message: 'Health key setup complete'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to setup health key'
      });
    }
  },

  // Verify health key (for frontend validation)
  async verifyHealthKey(req, res) {
    try {
      const userId = req.session.userId;
      const { healthKey } = req.body;

      if (!userId || !healthKey) {
        return res.status(400).json({
          success: false,
          error: 'Health key is required'
        });
      }

      const user = await User.findById(userId).select('healthKeyHash');
      if (!user || !user.healthKeyHash) {
        return res.status(404).json({
          success: false,
          error: 'No health key found'
        });
      }

      const isValid = await bcrypt.compare(healthKey, user.healthKeyHash);
      res.json({
        success: true,
        valid: isValid
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to verify health key'
      });
    }
  },

  // Decrypt health conditions (for AI/system use - NOT recommended for frontend)
  async decryptHealthConditions(req, res) {
    try {
      const userId = req.session.userId;
      const { key } = req.query;

      if (!userId || !key) {
        return res.status(401).json({
          success: false,
          error: 'Missing credentials'
        });
      }

      const user = await User.findById(userId).select('healthConditions healthKeyHash');
      if (!user || !user.healthConditions) {
        return res.json({
          success: true,
          conditions: []
        });
      }

      const isValid = await bcrypt.compare(key, user.healthKeyHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid health key'
        });
      }

      const decrypted = user.decryptHealthData(user.healthConditions, key);
      res.json({
        success: true,
        conditions: decrypted || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to decrypt health conditions'
      });
    }
  },

  // Decrypt allergies (for AI/system use - NOT recommended for frontend)
  async decryptAllergies(req, res) {
    try {
      const userId = req.session.userId;
      const { key } = req.query;

      if (!userId || !key) {
        return res.status(401).json({
          success: false,
          error: 'Missing credentials'
        });
      }

      const user = await User.findById(userId).select('allergies healthKeyHash');
      if (!user || !user.allergies) {
        return res.json({
          success: true,
          allergies: []
        });
      }

      const isValid = await bcrypt.compare(key, user.healthKeyHash);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid health key'
        });
      }

      const decrypted = user.decryptHealthData(user.allergies, key);
      res.json({
        success: true,
        allergies: decrypted || []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to decrypt allergies'
      });
    }
  },

  // Get predefined examples
  async getPredefinedExamples(req, res) {
    try {
      const examples = {
        healthConditions: [
          'Diabetes Type 1',
          'Diabetes Type 2',
          'Hypertension',
          'High Cholesterol',
          'Heart Disease',
          'Kidney Disease',
          'Liver Disease',
          'Gluten Intolerance',
          'Lactose Intolerance',
          'Irritable Bowel Syndrome',
          'Crohn\'s Disease',
          'Ulcerative Colitis',
          'Thyroid Disorder',
          'Asthma',
          'Migraines',
          'Arthritis',
          'Osteoporosis',
          'Anemia',
          'GERD',
          'PCOS'
        ],
        allergies: [
          'Peanuts',
          'Tree Nuts',
          'Milk',
          'Eggs',
          'Fish',
          'Shellfish',
          'Wheat',
          'Soy',
          'Sesame',
          'Mustard',
          'Celery',
          'Lupin',
          'Molluscs',
          'Sulphites',
          'Latex',
          'Pollen',
          'Dust Mites',
          'Mold',
          'Pet Dander',
          'Insect Stings'
        ]
      };

      res.json({
        success: true,
        examples
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get predefined examples'
      });
    }
  }
};

module.exports = profileController;