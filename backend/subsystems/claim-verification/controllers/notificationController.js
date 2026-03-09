const NotificationPreference = require('../models/NotificationPreference');
const AppNotification = require('../models/AppNotification');

// Save or update notification preferences for a student
const savePreference = async (req, res) => {
  try {
    const { email, name, receiveEmails, receiveInApp } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const preference = await NotificationPreference.findOneAndUpdate(
      { email: email.toLowerCase() },
      { email: email.toLowerCase(), name, receiveEmails, receiveInApp },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: preference });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};


// Get notification preference by email
const getPreference = async (req, res) => {
  try {
    const preference = await NotificationPreference.findOne({
      email: req.params.email.toLowerCase()
    });
    res.status(200).json({ success: true, data: preference });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get in-app notifications for a student
const getAppNotifications = async (req, res) => {
  try {
    const notifications = await AppNotification.find({
      recipientEmail: req.params.email.toLowerCase()
    }).sort({ createdAt: -1 }).limit(20);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Mark a single notification as read
const markAsRead = async (req, res) => {
  try {
    await AppNotification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Mark all notifications as read for an email
const markAllRead = async (req, res) => {
  try {
    await AppNotification.updateMany(
      { recipientEmail: req.params.email.toLowerCase(), isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = { savePreference, getPreference, getAppNotifications, markAsRead, markAllRead };
