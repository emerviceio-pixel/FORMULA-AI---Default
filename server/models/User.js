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
  
  // Authentication
  pinHash: {
    type: String,
    required: true
  },
  pinSalt: {
    type: String,
    required: true
  },
  recoveryWordHash: {
    type: String,
    required: true
  },
  recoveryWordSalt: {
    type: String,
    required: true
  },
  
  // PIN Attempt Tracking
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

// Method to encrypt health data
userSchema.methods.encryptHealthData = function(data, key) {
  const algorithm = 'aes-256-gcm'; // Use GCM for authentication
  const salt = 'health-data-salt'; // Should be consistent
  const keyBuffer = crypto.scryptSync(key, salt, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

// Method to decrypt health data
userSchema.methods.decryptHealthData = function(encryptedData, key) {
  if (!encryptedData) return null;
  
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) return null;
    
    const algorithm = 'aes-256-gcm';
    const salt = 'health-data-salt';
    const keyBuffer = crypto.scryptSync(key, salt, 32);
    
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final()
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

// Method to verify PIN
userSchema.methods.verifyPin = async function(pin) {
  const hash = await bcrypt.hash(pin, this.pinSalt);
  return hash === this.pinHash;
};

// Method to handle PIN verification with attempt tracking
userSchema.methods.verifyPinWithAttempts = async function(pin) {
  const now = new Date();
  
  // Check if user is currently locked out
  if (this.pinLockoutUntil && this.pinLockoutUntil > now) {
    const remainingTime = Math.ceil((this.pinLockoutUntil - now) / 1000);
    return {
      success: false,
      locked: true,
      remainingTime,
      attempts: this.pinAttempts
    };
  }
  
  // Verify PIN
  const isValid = await this.verifyPin(pin);
  
  if (isValid) {
    // Reset attempts on success
    this.pinAttempts = 0;
    this.lastPinAttemptAt = null;
    this.pinLockoutUntil = null;
    await this.save();
    
    return {
      success: true,
      attempts: 0
    };
  } else {
    // Increment attempts
    this.pinAttempts += 1;
    this.lastPinAttemptAt = now;
    
    // Calculate lockout duration after 3 attempts
    if (this.pinAttempts >= 3) {
      const lockoutDuration = Math.min(30 * (this.pinAttempts - 2), 300); // 30s, 60s, 90s, ..., max 5min
      this.pinLockoutUntil = new Date(now.getTime() + lockoutDuration * 1000);
    }
    
    await this.save();
    
    return {
      success: false,
      locked: this.pinAttempts >= 3,
      remainingTime: this.pinLockoutUntil ? Math.ceil((this.pinLockoutUntil - now) / 1000) : 0,
      attempts: this.pinAttempts
    };
  }
};

// Method to reset PIN attempts (for reset functionality)
userSchema.methods.resetPinAttempts = async function() {
  this.pinAttempts = 0;
  this.lastPinAttemptAt = null;
  this.pinLockoutUntil = null;
  await this.save();
};


// Method to verify recovery word
userSchema.methods.verifyRecoveryWord = async function(word) {
  const hash = await bcrypt.hash(word, this.recoveryWordSalt);
  return hash === this.recoveryWordHash;
};

// Method to reset PIN
userSchema.methods.resetPin = async function(newPin, recoveryWord) {
  const isValidRecovery = await this.verifyRecoveryWord(recoveryWord);
  if (!isValidRecovery) {
    throw new Error('Invalid recovery word');
  }
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPin, salt);
  
  this.pinSalt = salt;
  this.pinHash = hash;
  return this.save(); //Only save once
};


module.exports = mongoose.model('User', userSchema);