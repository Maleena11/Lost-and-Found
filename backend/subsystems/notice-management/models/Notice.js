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
  }
}, { timestamps: true });

// Auto-update isActive based on dates
NoticeSchema.pre('find', function() {
  this.where({
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

// Index for faster queries
NoticeSchema.index({ category: 1, startDate: -1 });
NoticeSchema.index({ isActive: 1, isPinned: -1, startDate: -1 });

const Notice = mongoose.model('Notice', NoticeSchema);

module.exports = Notice;