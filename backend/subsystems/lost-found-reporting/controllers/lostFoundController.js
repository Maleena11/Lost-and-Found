const LostFoundItem = require('../models/LostFoundItem');
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