const mongoose = require('mongoose');

const sightingNotificationSchema = new mongoose.Schema({
  recipientEmail: { type: String, required: true, lowercase: true },
  itemId:         { type: mongoose.Schema.Types.ObjectId, ref: 'LostFoundItem', required: true },
  itemName:       { type: String, required: true },
  sightingLocation: { type: String, required: true },
  message:        { type: String, default: '' },
  isRead:         { type: Boolean, default: false },
  createdAt:      { type: Date, default: Date.now }
});

sightingNotificationSchema.index({ recipientEmail: 1, isRead: 1 });

module.exports = mongoose.model('SightingNotification', sightingNotificationSchema);
