// server/models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  paymentMethod: {
    type: String,
    enum: ['paystack', 'cash', 'card', 'mobile_money'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  cancellationDate: {
    type: Date,
    default: null
  },
  // ✅ Revenue tracking fields
  paymentAmount: {
    type: Number,
    required: true
  },
  paymentCurrency: {
    type: String,
    default: 'GHS'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentReference: {
    type: String,
    required: true,
    unique: true
  },
  
   // Cash payment specific fields
  adminApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: String,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  receiptImage: String, // Optional: for uploaded receipts
  paymentLocation: String, // Physical store location
  
  // Status options for cash payments
  status: {
    type: String,
    enum: ['pending_approval', 'active', 'cancelled', 'expired', 'rejected'],
    default: 'pending_approval'
  }
}, {
  timestamps: true
});

// Index for revenue queries
subscriptionSchema.index({ paymentDate: 1, status: 1 });
subscriptionSchema.index({ userId: 1 });
// Note: paymentReference already has an index from unique: true constraint

module.exports = mongoose.model('Subscription', subscriptionSchema);