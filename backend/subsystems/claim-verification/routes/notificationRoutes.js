const express = require('express');
const router = express.Router();
const {
  savePreference,
  getPreference,
  getAppNotifications,
  markAsRead,
  markAllRead
} = require('../controllers/notificationController');

router.post('/preferences', savePreference);
router.get('/preferences/:email', getPreference);
router.get('/in-app/:email', getAppNotifications);
router.put('/in-app/:id/read', markAsRead);
router.put('/in-app/mark-all-read/:email', markAllRead);

module.exports = router;
