const mongoose = require('mongoose');

const NotificationPreferenceSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  receiveEmails: {
    type: Boolean,
    default: true
  },
  receiveInApp: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('NotificationPreference', NotificationPreferenceSchema);
