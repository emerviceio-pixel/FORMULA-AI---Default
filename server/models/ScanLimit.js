// server/models/ScanLimit.js
const mongoose = require('mongoose');

const scanLimitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  scansUsed: {
    type: Number,
    default: 0
  },
  limitReachedAt: {
    type: Date,
    default: null
  },
  nextResetAt: {
    type: Date,
    default: null
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp on save
scanLimitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
// Note: userId already has an index from unique: true constraint
scanLimitSchema.index({ nextResetAt: 1 }); // For finding expired limits

module.exports = mongoose.model('ScanLimit', scanLimitSchema);