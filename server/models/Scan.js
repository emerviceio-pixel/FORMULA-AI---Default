// server/models/Scan.js
const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodName: { type: String, required: true },
  safetyStatus: { 
    type: String, 
    enum: ['SAFE', 'CAUTIOUS', 'UNSAFE'], 
    required: true
  },
  analysis: String,
  tips: [String],
  recommendedPortion: String,
  bestTimeToEat: String,
  alternatives: [String],
  scannedAt: { type: Date, default: Date.now },
  
  // New fields for tracking input type and original user input
  inputType: {
    type: String,
    enum: ['VALID_FOOD', 'SPECIAL_KEY', 'RESTAURANT_NAME', 'PENDING_VALIDATION', 'UNCLEAR'],
    default: 'VALID_FOOD'
  },
  triggerValue: {
    type: String,
    default: null
  }
});

// Add index for better query performance
scanSchema.index({ userId: 1, scannedAt: -1 });
scanSchema.index({ userId: 1, inputType: 1 });

module.exports = mongoose.model('Scan', scanSchema);