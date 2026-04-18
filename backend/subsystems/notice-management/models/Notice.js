const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({

    userId: {
    type: String,
    required: true,
    ref: 'User' // Assuming you have a User model
  },
  title: {
    type: String,
    required: [true, 'Please provide a notice title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide notice content'],
    trim: true
  },
  category: {
    type: String,
    enum: ['lost-item', 'found-item', 'announcement', 'advisory'],
    default: 'lost-item'
  },
  itemType: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'urgent'],
    default: 'medium'
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date'],
    default: Date.now
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        // EndDate must be after startDate
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  
  attachments: [{
    type: String  // URL to stored files
  }],
  postedBy: {
    type: String,  // Store the user ID as a string
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved' // Staff notices are default approved
  },
  aiMetadata: {
    type: Object, // Stores Edge AI prediction arrays
    default: null
  },
  targetAudience: {
    type: String,
    enum: ['all-students', 'undergraduate', 'postgraduate', 'academic-staff', 'non-academic-staff', 'all-university'],
    default: 'all-students'
  },
  busRouteId: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  }
}, { timestamps: true });

// Exclude expired, archived, and non-approved notices from normal queries
NoticeSchema.pre('find', function() {
  this.where({
    isArchived: { $ne: true },
    status: { $in: ['approved', null] }, // Only show approved notices publicly
    $or: [
      { endDate: { $gt: new Date() } },
      { endDate: { $exists: false } }
    ]
  });
});

// Virtual property to check if notice is expired
NoticeSchema.virtual('isExpired').get(function() {
  if (!this.endDate) return false;
  return this.endDate < new Date();
});

// Static methods that bypass the pre('find') hook (use raw collection)
NoticeSchema.statics.findWithArchived = function(query) {
  return this.collection.find(query).toArray();
};
NoticeSchema.statics.deleteWithArchived = function(query) {
  return this.collection.deleteMany(query);
};

// Index for faster queries
NoticeSchema.index({ category: 1, startDate: -1 });
NoticeSchema.index({ isActive: 1, isPinned: -1, startDate: -1 });

const Notice = mongoose.model('Notice', NoticeSchema);

module.exports = Notice;