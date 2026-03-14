const mongoose = require('mongoose');

const lostFoundItemSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User' // Assuming you have a User model
  },
  itemType: {
    type: String,
    enum: ['lost', 'found'],
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'clothing', 'jewellery', 'documents', 'accessories', 'other']
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String, // Base64 string
    required: false
  }],
  location: {
    type: String,
    required: true
  },
  faculty: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  building: {
    type: String,
    default: ''
  },
  yearGroup: {
    type: String,
    default: ''
  },
  dateTime: {
    type: Date,
    required: true
  },
  contactInfo: {
    name: String,
    phone: String,
    email: String
  },
  status: {
    type: String,
    enum: ['pending', 'claimed', 'returned', 'expired'],
    default: 'pending'
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
lostFoundItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const LostFoundItem = mongoose.model('LostFoundItem', lostFoundItemSchema);

module.exports = LostFoundItem;