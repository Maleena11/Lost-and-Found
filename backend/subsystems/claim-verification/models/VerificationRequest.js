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
  }
});



const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);

module.exports = VerificationRequest;