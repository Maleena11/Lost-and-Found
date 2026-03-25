const Notice = require('../models/Notice');
const NotificationPreference = require('../../claim-verification/models/NotificationPreference');
const AppNotification = require('../../claim-verification/models/AppNotification');
const mongoose = require('mongoose');
const { sendNoticeNotification } = require('../../../utils/emailService');

/**
 * @desc    Create a new notice 
 * @route   POST /api/notices
 */
const createNotice = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      itemType,
      priority,
      startDate,
      endDate,
      attachments,
      targetAudience,
      postedBy,
      contactPhone,
      contactEmail
    } = req.body;

    // Create the notice
    const notice = await Notice.create({
      title,
      content,
      category,
      itemType,
      priority,
      startDate,
      endDate,
      attachments,
      targetAudience,
      // Store the user ID in both fields for compatibility
      userId: postedBy || req.body.userId || 'unknown',
      postedBy: postedBy || req.body.userId || 'unknown',
      contactPhone,
      contactEmail
    });
    
    // Send email notifications to opted-in students (non-blocking)
    NotificationPreference.find({ receiveEmails: true }).then(emailPrefs => {
      emailPrefs.forEach(pref => {
        sendNoticeNotification(pref.email, notice).catch(err =>
          console.error(`[Email] Failed to send to ${pref.email}:`, err.message)
        );
      });
    }).catch(err => console.error('[Email] Failed to fetch preferences:', err.message));

    // Create in-app notifications for opted-in students (non-blocking)
    NotificationPreference.find({ receiveInApp: true }).then(inAppPrefs => {
      if (inAppPrefs.length === 0) return;
      AppNotification.insertMany(inAppPrefs.map(pref => ({
        recipientEmail: pref.email,
        noticeId: notice._id,
        title: notice.title,
        message: notice.content.substring(0, 150),
        category: notice.category,
        priority: notice.priority,
        isRead: false
      }))).catch(err => console.error('[InApp] Failed to create notifications:', err.message));
    }).catch(err => console.error('[InApp] Failed to fetch preferences:', err.message));

    res.status(201).json({
      success: true,
      data: notice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get all notices (with filtering options)
 * @route   GET /api/notices
 */
const getNotices = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { category, priority, isActive, targetAudience, userId, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (targetAudience) filter.targetAudience = targetAudience;
    if (userId) {
      // Allow filtering by user ID - check both fields
      filter.$or = [{ userId: userId }, { postedBy: userId }];
    }
    
    // Execute query
    const notices = await Notice.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
      
    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get a single notice
 * @route   GET /api/notices/:id
 */
const getNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Update a notice
 * @route   PUT /api/notices/:id
 */
const updateNotice = async (req, res) => {
  try {
    let notice = await Notice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }
    
    // Prepare update data
    const updateData = { ...req.body };
    
    // Handle date validation
    if (updateData.startDate && updateData.endDate) {
      const startDate = new Date(updateData.startDate);
      const endDate = new Date(updateData.endDate);
      
      // If dates are the same, adjust the endDate to be 1 ms later
      if (startDate.getTime() === endDate.getTime()) {
        endDate.setMilliseconds(endDate.getMilliseconds() + 1);
        updateData.endDate = endDate;
      }
      // If end date is before start date, remove end date to avoid validation error
      else if (startDate > endDate) {
        delete updateData.endDate;
      }
    }
    
    // If userId is being updated, also update postedBy for consistency
    if (updateData.userId && !updateData.postedBy) {
      updateData.postedBy = updateData.userId;
    }
    
    // If postedBy is being updated, also update userId for consistency
    if (updateData.postedBy && !updateData.userId) {
      updateData.userId = updateData.postedBy;
    }
    
    // Update the notice - use validateBeforeSave: false to bypass model validation
    notice = await Notice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true,
        runValidators: false // Turn off validators for this update
      }
    );
    
    res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error("Update notice error:", error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Delete a notice
 * @route   DELETE /api/notices/:id
 */
const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        error: 'Notice not found'
      });
    }
    
    // Use deleteOne instead of remove() which is deprecated
    await Notice.deleteOne({ _id: req.params.id });

    // Delete all app notifications linked to this notice
    await AppNotification.deleteMany({ noticeId: new mongoose.Types.ObjectId(req.params.id) });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get latest active notices
 * @route   GET /api/notices/latest
 */
const getLatestNotices = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const notices = await Notice.find({ isActive: true })
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get notices by category
 * @route   GET /api/notices/category/:category
 */
const getNoticesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const notices = await Notice.find({
      category,
      isActive: true
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get notices for specific audience
 * @route   GET /api/notices/audience/:audience
 */
const getNoticesByAudience = async (req, res) => {
  try {
    const { audience } = req.params;
    
    const notices = await Notice.find({
      $or: [
        { targetAudience: audience },
        { targetAudience: 'all-users' }
      ],
      isActive: true
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Delete all expired notices (endDate < now)
 * @route   DELETE /api/notices/expired
 */
const deleteExpiredNotices = async (_req, res) => {
  try {
    // Only delete low/medium expired notices — urgent ones are archived, not deleted
    const result = await Notice.deleteWithArchived({
      priority: { $in: ['low', 'medium'] },
      isArchived: { $ne: true },
      endDate: { $exists: true, $lt: new Date() }
    });

    res.status(200).json({
      success: true,
      deleted: result.deletedCount,
      message: `${result.deletedCount} expired notice(s) removed.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Smart keyword search with auto-suggestion support
 * @route   GET /api/notices/search?q=black+wallet&category=found-item
 */
const searchNotices = async (req, res) => {
  try {
    const { q, category } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Build a regex for each keyword
    const keywords = q.trim().split(/\s+/).filter(w => w.length > 1);
    const regexList = keywords.map(k => new RegExp(k, 'i'));

    const filter = {
      $or: [
        { title:    { $in: regexList } },
        { content:  { $in: regexList } },
        { itemType: { $in: regexList } }
      ]
    };

    if (category) filter.category = category;

    const priorityOrder = { urgent: 3, medium: 2, low: 1 };

    const results = await Notice.find(filter)
      .limit(8)
      .sort({ createdAt: -1 });

    // Sort urgent first in-memory
    results.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getArchivedNotices = async (_req, res) => {
  try {
    const now = new Date();

    // Step 1: Find any urgent notices that have expired but are not yet archived
    const urgentExpired = await Notice.findWithArchived({
      priority: 'urgent',
      isArchived: { $ne: true },
      endDate: { $exists: true, $lt: now }
    });

    // Step 2: Archive them immediately before returning results
    if (urgentExpired.length > 0) {
      const urgentIds = urgentExpired.map(n => n._id);
      await Notice.collection.updateMany(
        { _id: { $in: urgentIds } },
        { $set: { isArchived: true, archivedAt: now } }
      );
      console.log(`[Archive] Archived ${urgentExpired.length} expired urgent notice(s) on-demand.`);
    }

    // Step 3: Return all archived notices sorted by archivedAt descending
    const archived = await Notice.findWithArchived({ isArchived: true });
    archived.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt));

    res.status(200).json({ success: true, data: archived });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createNotice,
  getNotices,
  getNotice,
  updateNotice,
  deleteNotice,
  getLatestNotices,
  getNoticesByCategory,
  getNoticesByAudience,
  searchNotices,
  deleteExpiredNotices,
  getArchivedNotices
};