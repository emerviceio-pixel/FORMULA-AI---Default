// models/DeletedAccount.js
const mongoose = require('mongoose');

const deletedAccountSchema = new mongoose.Schema({
  // Original user data (mirror User schema but make all fields optional)
  originalUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  googleId: String,
  email: {
    type: String,
    required: true,
    index: true
  },
  nickname: String,
  
  // Store all user data as a snapshot
  userData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Deletion metadata
  deletedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  deletedBy: {
    type: String,
    enum: ['user', 'admin', 'system'],
    default: 'user'
  },
  deletionReason: String,
  userFeedback: String,
  
  // Anonymized email for GDPR compliance if needed
  anonymizedEmail: String,
  
  // IP and user agent for audit
  ipAddress: String,
  userAgent: String,
  
  // Data retention for legal purposes (e.g., keep for 90 days then auto-delete)
  retentionUntil: {
    type: Date,
    default: () => new Date(+new Date() + 90*24*60*60*1000) // 90 days from now
  }
}, {
  timestamps: true
});

// Index for cleanup jobs
deletedAccountSchema.index({ retentionUntil: 1 });

// Method to anonymize sensitive data
deletedAccountSchema.methods.anonymize = function() {
  if (this.email) {
    const [localPart, domain] = this.email.split('@');
    this.anonymizedEmail = `${localPart.substring(0, 2)}***@${domain}`;
  }
  return this;
};

module.exports = mongoose.model('DeletedAccount', deletedAccountSchema);