const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  scanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Scan', 
    required: true 
  },
  feedbackType: { 
    type: String, 
    enum: ['good', 'bad'], 
    required: true 
  },
  
  // Context for AI training
  originalInput: { 
    type: String, 
    required: true 
  },
  inputType: { 
    type: String, 
    enum: ['VALID_FOOD', 'RESTAURANT_NAME', 'SPECIAL_KEY'] 
  },
  aiResponse: { 
    type: Object, 
    required: true 
  },
  userCountry: { 
    type: String 
  },
  userHealthConditions: [String],
  userAllergies: [String],
  userSubscription: { 
    type: String 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // Track if feedback has been updated (for analytics)
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// unique compound index to prevent multiple feedback per scan per user
feedbackSchema.index({ userId: 1, scanId: 1 }, { unique: true });

// Update the updatedAt timestamp on save
feedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Feedback', feedbackSchema);