const SystemSettings = require('../models/SystemSettings');

// GET /api/settings
const getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ _singleton: 'global' });
    if (!settings) {
      settings = await SystemSettings.create({ _singleton: 'global' });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings', message: err.message });
  }
};

// PUT /api/settings
const updateSettings = async (req, res) => {
  try {
    // Strip immutable/internal fields
    const { _id, _singleton, __v, createdAt, updatedAt, ...updates } = req.body;

    const settings = await SystemSettings.findOneAndUpdate(
      { _singleton: 'global' },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings', message: err.message });
  }
};

module.exports = { getSettings, updateSettings };
