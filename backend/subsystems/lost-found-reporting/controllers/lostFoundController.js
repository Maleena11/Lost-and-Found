const LostFoundItem = require('../models/LostFoundItem');
const SightingNotification = require('../models/SightingNotification');
const { Jimp, JimpMime } = require('jimp');

const THUMB_SIZE = 80;

async function generateThumbnail(base64DataUrl) {
  const base64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const image = await Jimp.read(buffer);
  const size = Math.min(image.width, image.height);
  image
    .crop({
      x: Math.floor((image.width - size) / 2),
      y: Math.floor((image.height - size) / 2),
      w: size,
      h: size,
    })
    .resize({ w: THUMB_SIZE, h: THUMB_SIZE });
  const thumbBuffer = await image.getBuffer(JimpMime.jpeg);
  return 'data:image/jpeg;base64,' + thumbBuffer.toString('base64');
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function canManageSighting(sighting, reporterEmail) {
  return normalizeEmail(sighting?.reporterEmail) && normalizeEmail(sighting?.reporterEmail) === normalizeEmail(reporterEmail);
}

// Get all lost and found items
// Supports ?lean=true to exclude base64 images for fast list views
// Supports ?page=1&limit=50 for pagination
exports.getAllItems = async (req, res) => {
  try {
    const isLean = req.query.lean === 'true';
    const projection = isLean
      ? { images: 0 }
      : {};
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const query = LostFoundItem.find({}, projection).sort({ createdAt: -1 }).skip(skip).limit(limit);
    if (isLean) query.lean();

    const [items, total] = await Promise.all([
      query,
      LostFoundItem.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get aggregated location counts for the campus heatmap
// Supports ?category=&itemType=lost|found&timeRange=week|month|semester|year|all
exports.getHeatmapData = async (req, res) => {
  try {
    const { category, itemType, timeRange } = req.query;
    const query = {};

    if (category && category !== 'all') query.category = category;
    if (itemType && itemType !== 'all') query.itemType = itemType;

    if (timeRange && timeRange !== 'all') {
      const now = Date.now();
      const ms = { week: 7, month: 30, semester: 120, year: 365 };
      const days = ms[timeRange];
      if (days) query.createdAt = { $gte: new Date(now - days * 86400000) };
    }

    const items = await LostFoundItem.find(query, { location: 1, itemType: 1 }).lean();

    const locationMap = {};
    items.forEach(item => {
      const loc = (item.location || '').trim();
      if (!loc) return;
      if (!locationMap[loc]) locationMap[loc] = { total: 0, lost: 0, found: 0 };
      locationMap[loc].total++;
      if (item.itemType === 'lost') locationMap[loc].lost++;
      else locationMap[loc].found++;
    });

    const data = Object.entries(locationMap)
      .map(([location, counts]) => ({ location, ...counts }))
      .sort((a, b) => b.total - a.total);

    res.status(200).json({ success: true, data, totalItems: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a specific item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Create a new lost or found item
exports.createItem = async (req, res) => {
  try {
    // Extract item data from request body
    const {
      userId,
      itemType,
      itemName,
      category,
      description,
      images,
      location,
      dateTime,
      contactInfo
    } = req.body;

    // Auto-generate thumbnail from first image
    let thumbnail;
    if (Array.isArray(images) && images.length > 0) {
      try {
        thumbnail = await generateThumbnail(images[0]);
      } catch { /* proceed without thumbnail */ }
    }

    // Create new item
    const newItem = await LostFoundItem.create({
      userId,
      itemType,
      itemName,
      category,
      description,
      images,
      thumbnail,
      location,
      dateTime: new Date(dateTime),
      contactInfo
    });

    res.status(201).json({
      success: true,
      data: newItem
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// Update an existing item
exports.updateItem = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Check if user has permission (userId matches or is admin)
    if (item.userId !== req.body.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this item'
      });
    }

    const updatedItem = await LostFoundItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update item status
exports.updateItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'claimed', 'returned', 'expired'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const item = await LostFoundItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    item.status = status;
    if (['claimed', 'returned'].includes(status)) {
      item.isResolved = true;
    }

    await item.save();

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Check if user has permission (userId matches or is admin)
    if (item.userId !== req.body.userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this item'
      });
    }

    // Use findByIdAndDelete instead of the deprecated remove() method
    await LostFoundItem.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Add a sighting to a lost item
// POST /api/lost-found/:id/sightings
exports.addSighting = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    if (item.itemType !== 'lost') return res.status(400).json({ success: false, error: 'Sightings are only for lost items' });

    const { location, dateTime, note, reporterEmail, reporterPhone } = req.body;
    if (!location || !dateTime) return res.status(400).json({ success: false, error: 'Location and dateTime are required' });
    const normalizedPhone = typeof reporterPhone === 'string' ? reporterPhone.trim() : '';
    if (!/^07\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({ success: false, error: 'Phone number must be a valid 10-digit mobile number starting with 07.' });
    }

    // Prevent item owner from adding sightings to their own item
    if (reporterEmail && item.contactInfo?.email &&
        reporterEmail.toLowerCase() === item.contactInfo.email.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'You cannot add a sighting to your own item.' });
    }

    const sighting = {
      location,
      dateTime: new Date(dateTime),
      note: note || '',
      reporterEmail: reporterEmail ? reporterEmail.toLowerCase() : '',
      reporterPhone: normalizedPhone
    };
    item.sightings.push(sighting);
    await item.save();

    const newSighting = item.sightings[item.sightings.length - 1];

    // Create in-app notification for the item owner
    if (item.contactInfo && item.contactInfo.email) {
      const newNotif = await SightingNotification.create({
        recipientEmail: item.contactInfo.email,
        itemId:         item._id,
        itemName:       item.itemName,
        sightingLocation: location,
        message: note || '',
      });

      // Emit live notification via Socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(item.contactInfo.email.toLowerCase()).emit('new_sighting_notification', newNotif);
      }
    }

    res.status(201).json({ success: true, data: newSighting, sightings: item.sightings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Owner reacts to a sighting — helpful or dismissed
// PATCH /api/lost-found/:id/sightings/:sightingId
exports.reactToSighting = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

    // Only the item owner can react — check by userId or by contact email (handles legacy tempUserId items)
    const { userId, userEmail, reaction } = req.body;
    const ownerById    = userId && item.userId === String(userId);
    const ownerByEmail = userEmail && item.contactInfo?.email &&
                         userEmail.toLowerCase() === item.contactInfo.email.toLowerCase();
    if (!ownerById && !ownerByEmail) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const sighting = item.sightings.id(req.params.sightingId);
    if (!sighting) return res.status(404).json({ success: false, error: 'Sighting not found' });

    // reaction already destructured above: 'helpful' | 'dismissed'
    if (reaction === 'helpful')   { sighting.helpful = true;  sighting.dismissed = false; }
    if (reaction === 'dismissed') { sighting.dismissed = true; sighting.helpful = false; }

    await item.save();
    res.status(200).json({ success: true, data: sighting, sightings: item.sightings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Update a sighting note by the original reporter
// PUT /api/lost-found/:id/sightings/:sightingId
exports.updateSighting = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

    const sighting = item.sightings.id(req.params.sightingId);
    if (!sighting) return res.status(404).json({ success: false, error: 'Sighting not found' });

    const { reporterEmail, note } = req.body;
    if (!canManageSighting(sighting, reporterEmail)) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this sighting' });
    }

    if (sighting.helpful) {
      return res.status(400).json({ success: false, error: 'Confirmed helpful sightings cannot be edited.' });
    }

    const { location, dateTime } = req.body;
    if (!location || !dateTime) {
      return res.status(400).json({ success: false, error: 'Location and dateTime are required' });
    }

    sighting.location = location;
    sighting.dateTime = new Date(dateTime);
    sighting.note = typeof note === 'string' ? note.trim() : '';

    await item.save();
    res.status(200).json({ success: true, data: sighting, sightings: item.sightings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Delete a sighting by the original reporter
// DELETE /api/lost-found/:id/sightings/:sightingId
exports.deleteSighting = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

    const sighting = item.sightings.id(req.params.sightingId);
    if (!sighting) return res.status(404).json({ success: false, error: 'Sighting not found' });

    const { reporterEmail } = req.body;
    if (!canManageSighting(sighting, reporterEmail)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this sighting' });
    }

    if (sighting.helpful) {
      return res.status(400).json({ success: false, error: 'Confirmed helpful sightings cannot be deleted.' });
    }

    item.sightings.pull(req.params.sightingId);

    await item.save();
    res.status(200).json({ success: true, sightings: item.sightings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get unread sighting notifications for an item owner by email
// GET /api/lost-found/sighting-notifications/:email
exports.getSightingNotifications = async (req, res) => {
  try {
    const notifications = await SightingNotification.find({
      recipientEmail: req.params.email.toLowerCase(),
    }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Mark a sighting notification as read
// PATCH /api/lost-found/sighting-notifications/:notifId/read
exports.markSightingNotificationRead = async (req, res) => {
  try {
    const notif = await SightingNotification.findByIdAndUpdate(
      req.params.notifId,
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.status(200).json({ success: true, data: notif });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Search lost and found items with filters (type, category, location, date range, keyword)
exports.searchItems = async (req, res) => {
  try {
    const { itemType, category, location, dateFrom, dateTo, query } = req.query;
    
    // Build search criteria
    let searchCriteria = {};
    
    if (itemType) searchCriteria.itemType = itemType;
    if (category) searchCriteria.category = category;
    if (location) searchCriteria.location = { $regex: location, $options: 'i' };
    
    // Date range
    if (dateFrom || dateTo) {
      searchCriteria.dateTime = {};
      if (dateFrom) searchCriteria.dateTime.$gte = new Date(dateFrom);
      if (dateTo) searchCriteria.dateTime.$lte = new Date(dateTo);
    }
    
    // Text search
    if (query) {
      searchCriteria.$or = [
        { itemName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }
    
    const items = await LostFoundItem.find(searchCriteria);
    
    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
