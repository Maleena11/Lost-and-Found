const mongoose = require('mongoose');

const NoticeCommentSchema = new mongoose.Schema({
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
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index to quickly fetch comments for a specific notice, sorted by newest
NoticeCommentSchema.index({ noticeId: 1, createdAt: -1 });

module.exports = mongoose.model('NoticeComment', NoticeCommentSchema);
