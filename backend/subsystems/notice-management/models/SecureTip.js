const mongoose = require('mongoose');

const secureTipSchema = new mongoose.Schema({
  noticeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notice',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: 'Anonymous User'
  },
  text: {
    type: String,
    required: [true, 'Tip text is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  }
}, {
  timestamps: true
});

const SecureTip = mongoose.model('SecureTip', secureTipSchema);

module.exports = SecureTip;
