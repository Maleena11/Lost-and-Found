const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    _singleton: { type: String, default: 'global', unique: true },
    // General
    systemName:     { type: String, default: 'UniFind — University Lost & Found' },
    adminEmail:     { type: String, default: 'foundsliit@gmail.com' },
    contactPhone:   { type: String, default: '+94 11 754 4801' },
    timezone:       { type: String, default: 'Asia/Colombo' },
    language:       { type: String, default: 'en' },
    websiteUrl:     { type: String, default: '' },
    officeLocation: { type: String, default: 'SLIIT Malabe Campus, New Kandy Road' },
    officeHours:    { type: String, default: 'Mon–Fri, 8:30 AM – 5:00 PM' },
    // Notifications
    emailNotifications: { type: Boolean, default: true },
    smsAlerts:          { type: Boolean, default: false },
    inAppNotifications: { type: Boolean, default: true },
    notifyOnNewItem:    { type: Boolean, default: true },
    notifyOnClaim:      { type: Boolean, default: true },
    notifyOnExpiry:     { type: Boolean, default: false },
    digestFrequency:    { type: String,  default: 'daily' },
    // Display
    itemsPerPage:       { type: String,  default: '10' },
    dateFormat:         { type: String,  default: 'MMM DD, YYYY' },
    theme:              { type: String,  default: 'light' },
    defaultItemView:    { type: String,  default: 'table' },
    showItemThumbnails: { type: Boolean, default: true },
    // Data & Retention
    retentionDays:    { type: Number,  default: 90 },
    autoArchive:      { type: Boolean, default: true },
    archiveAfterDays: { type: Number,  default: 30 },
    // Security
    sessionTimeout:      { type: String,  default: '60' },
    minPasswordLength:   { type: String,  default: '8' },
    requireSpecialChars: { type: Boolean, default: true },
    twoFactorAuth:       { type: Boolean, default: false },
    maxLoginAttempts:    { type: String,  default: '5' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
