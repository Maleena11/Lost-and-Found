const mongoose = require('mongoose');

const AppNotificationSchema = new mongoose.Schema({
  recipientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  noticeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notice'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String
  },
  category: {
    type: String
  },
  priority: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });



module.exports = mongoose.model('AppNotification', AppNotificationSchema);
