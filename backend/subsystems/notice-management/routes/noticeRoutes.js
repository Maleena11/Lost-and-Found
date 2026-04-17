const express = require('express');
const router = express.Router();
const {
  createNotice,
  getNotices,
  getNotice,
  updateNotice,
  deleteNotice,
  getLatestNotices,
  getNoticesByCategory,
  getNoticesByAudience,
  deleteExpiredNotices,
  searchNotices,
  getArchivedNotices,
  createSecureTip,
  getAllSecureTips,
  forwardNoticeAlert,
  createSmartReport,
  getPendingNotices,
  updateNoticeStatus,
  getComments,
  createComment
} = require('../controllers/noticeController');

// Smart keyword search (must be before /:id)
router.get('/search', searchNotices);

// Archived notices
router.get('/archived', getArchivedNotices);

// Secure tips
router.get('/tips/all', getAllSecureTips);
router.post('/:id/tips', createSecureTip);
router.post('/:id/forward-alert', forwardNoticeAlert);

// Community sightings comments
router.get('/:id/comments', getComments);
router.post('/:id/comments', createComment);

// Smart Report Routes
router.post('/smart-report', createSmartReport);
router.get('/pending', getPendingNotices);
router.patch('/:id/status', updateNoticeStatus);

// Get latest notices
router.get('/latest', getLatestNotices);

// Get notices by category
router.get('/category/:category', getNoticesByCategory);

// Get notices by audience
router.get('/audience/:audience', getNoticesByAudience);

// Public routes
router.get('/', getNotices);
router.get('/:id', getNotice);

// Routes for creating, updating and deleting
router.post('/', createNotice);
router.put('/:id', updateNotice);
router.delete('/expired', deleteExpiredNotices);
router.delete('/:id', deleteNotice);

module.exports = router;
