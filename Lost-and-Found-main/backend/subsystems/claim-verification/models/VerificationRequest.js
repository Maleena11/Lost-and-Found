const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LostFoundItem',
    required: true
  },
  claimantInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  verificationDetails: {
    description: {
      type: String,
      required: true
    },
    ownershipProof: {
      type: String,
      required: true
    },
    additionalInfo: {
      type: String
    }
  },
  claimantImages: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: String // Admin user ID
  },
  notes: {
    type: String // Admin notes
  },
  approvalStages: {
    stage1: {
      status: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
      notes: { type: String, default: '' }
    },
    stage2: {
      status: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
      notes: { type: String, default: '' }
    },
    stage3: {
      status: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
      notes: { type: String, default: '' }
    }
  },
  // Collection confirmation — PIN is bcrypt-hashed, only plain text is sent via email
  collectionPin: { type: String },
  collectionPinExpiry: { type: Date },
  collectedAt: { type: Date }
  ,
  recommendation: {
    score: { type: Number, default: 0 },
    band: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    action: {
      type: String,
      enum: [
        'approve_candidate',
        'manual_review',
        'needs_more_evidence',
        'reject_candidate',
        'approved',
        'collected',
      ],
      default: 'manual_review',
    },
    actionLabel: { type: String, default: 'Manual Review' },
    summary: { type: String, default: '' },
    reasons: { type: [String], default: [] },
    risks: { type: [String], default: [] },
    competingClaims: { type: Number, default: 0 },
    breakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    updatedAt: { type: Date, default: Date.now },
  }
});



const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);

module.exports = VerificationRequest;
