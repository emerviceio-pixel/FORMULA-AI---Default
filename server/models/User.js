const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const healthConditionSchema = new mongoose.Schema({
  condition: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const allergySchema = new mongoose.Schema({
  allergen: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    default: 'moderate'
  },
  reaction: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  // OAuth Info
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  // PIN fields - REMOVED required flag (optional for new users)
  pinHash: {
    type: String
    // required: true  ← REMOVED
  },
  pinSalt: {
    type: String
    // required: true  ← REMOVED
  },
  recoveryWordHash: {
    type: String
    // required: true  ← REMOVED
  },
  recoveryWordSalt: {
    type: String
    // required: true  ← REMOVED
  },
  
  // PIN Attempt Tracking (keep but optional)
  pinAttempts: {
    type: Number,
    default: 0
  },
  lastPinAttemptAt: {
    type: Date,
    default: null
  },
  pinLockoutUntil: {
    type: Date,
    default: null
  },
  
  // Profile Information
  nickname: {
    type: String,
    trim: true
  },
  dateOfBirth: Date,
  country: String,
  height: {
    value: Number,
    unit: {
      type: String,
      enum: ['cm', 'ft'],
      default: 'cm'
    }
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'lb'],
      default: 'kg'
    }
  },
  bmi: Number,
  bmiCategory: {
    type: String,
    enum: ['underweight', 'normal', 'overweight', 'obese']
  },
  
  // Health & Lifestyle
  dietaryGoal: {
    type: String,
    enum: ['maintain', 'gain', 'muscle', 'lose', 'healthy']
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active']
  },
  
  // Encrypted Health Data
  healthConditions: {
    type: String, // Encrypted JSON string
    select: false
  },
  allergies: {
    type: String, // Encrypted JSON string
    select: false
  },

  healthKeyHash: {
    type: String,
    select: false
  },
  hasHealthKey: {
    type: Boolean,
    default: false
  },

  healthConditionsSystemEncrypted: {
    type: String,
    select: false
  },

  allergiesSystemEncrypted: {
    type: String,
    select: false
  },
  
  // Subscription
  subscription: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  subscriptionExpiry: {
    type: Date,
    default: null
  },

  admin: {
    type: Boolean,
    default: false
  },
  
  'paystack.customerCode': { type: String },
  'paystack.subscriptionCode': { type: String },

  'settings.paymentMethod': {
    type: String,
    enum: ['card', 'mobile'],
    default: 'card'
  },
  'settings.lastPaymentReference': {
    type: String,
    default: null
  },
  
  // Settings
  settings: {
    darkMode: {
      type: Boolean,
      default: false
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Usage Tracking
  dailyScans: {
    type: Number,
    default: 0
  },
  lastScanReset: {
    type: Date,
    default: Date.now
  },
  totalScans: {
    type: Number,
    default: 0
  },
  scanLimit: { 
    type: Number, 
    default: 15
  },
  lastActiveAt: {
    type: Date,
    default: null
  },

  manualFoodHistory: {
    type: [String],
    default: []
  },
  recommendedFoodHistory: {
    type: [String],
    default: []
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Deletion tracking
  markedForDeletion: {
    type: Date,
    default: null
  },
  deletionScheduledAt: {
    type: Date,
    default: null
  },

  migratedToSystemKey: {
    type: Boolean,
    default: false
  },
  
  // Data retention
  dataRetentionDays: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

// Middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to calculate BMI
userSchema.methods.calculateBMI = function() {
  let heightInMeters, weightInKg;
  
  // Convert to metric if needed
  if (this.height.unit === 'cm') {
    heightInMeters = this.height.value / 100;
  } else {
    // Convert feet to meters
    heightInMeters = this.height.value * 0.3048;
  }
  
  if (this.weight.unit === 'kg') {
    weightInKg = this.weight.value;
  } else {
    // Convert pounds to kg
    weightInKg = this.weight.value * 0.453592;
  }
  
  const bmi = weightInKg / (heightInMeters * heightInMeters);
  this.bmi = parseFloat(bmi.toFixed(1));
  
  // Determine BMI category
  if (bmi < 18.5) {
    this.bmiCategory = 'underweight';
  } else if (bmi >= 18.5 && bmi < 25) {
    this.bmiCategory = 'normal';
  } else if (bmi >= 25 && bmi < 30) {
    this.bmiCategory = 'overweight';
  } else {
    this.bmiCategory = 'obese';
  }
  
  return bmi;
};

userSchema.methods.encryptHealthData = function(data) {
  const { encrypt } = require('../utils/encryption');
  return encrypt(data);
};

// REPLACE decryptHealthData method with:
userSchema.methods.decryptHealthData = function(encryptedData) {
  const { decrypt } = require('../utils/encryption');
  return decrypt(encryptedData);
};


module.exports = mongoose.model('User', userSchema);