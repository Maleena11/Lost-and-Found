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
  }
});

const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);

module.exports = VerificationRequest;