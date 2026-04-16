const Zone = require('../models/Zone');

// Default zone catalogue — mirrors the hardcoded ZONES in CampusHeatmap.jsx
// Used to seed the database on first run.
const DEFAULT_ZONES = [
  // Basement
  { zoneId: 'BF-CAN',  name: 'Campus Canteen',      floor: 'BF',  type: 'food',     keywords: ['canteen', 'cafeteria', 'basement canteen', 'bf-can', 'bf can', 'basement'] },
  // 1st floor
  { zoneId: 'F1-A101', name: 'Lecture Hall A101',    floor: '1F',  type: 'hall',     keywords: ['a101', 'hall a101', 'lecture a101'] },
  { zoneId: 'F1-A102', name: 'Lecture Hall A102',    floor: '1F',  type: 'hall',     keywords: ['a102', 'hall a102', 'lecture a102'] },
  { zoneId: 'F1-NSTF', name: 'Staff Rooms (1F)',     floor: '1F',  type: 'admin',    keywords: ['staff room', 'non-academic', 'nstf', '1f staff'] },
  // 2nd floor
  { zoneId: 'F2-CAF',  name: 'Cafe (2F)',            floor: '2F',  type: 'food',     keywords: ['cafe', '2nd floor cafe', 'f2-caf', 'f2 cafe'] },
  { zoneId: 'F2-A201', name: 'Lecture Hall A201',    floor: '2F',  type: 'hall',     keywords: ['a201', 'hall a201', 'lecture a201'] },
  { zoneId: 'F2-A202', name: 'Lecture Hall A202',    floor: '2F',  type: 'hall',     keywords: ['a202', 'hall a202', 'lecture a202'] },
  { zoneId: 'F2-A203', name: 'Lecture Hall A203',    floor: '2F',  type: 'hall',     keywords: ['a203', 'hall a203', 'lecture a203'] },
  { zoneId: 'F2-IGR',  name: 'Indoor Game Room',     floor: '2F',  type: 'shared',   keywords: ['game room', 'indoor game', 'recreation', 'igr', 'game hall'] },
  // 3rd floor
  { zoneId: 'F3-SIS',  name: 'SIS Room',             floor: '3F',  type: 'sis',      keywords: ['sis', 'student information', 'sis room', 'sis counter'] },
  { zoneId: 'F3-A301', name: 'Lecture Hall A301',    floor: '3F',  type: 'hall',     keywords: ['a301', 'hall a301', 'lecture a301'] },
  { zoneId: 'F3-A302', name: 'Lecture Hall A302',    floor: '3F',  type: 'hall',     keywords: ['a302', 'hall a302', 'lecture a302'] },
  { zoneId: 'F3-A303', name: 'Lecture Hall A303',    floor: '3F',  type: 'hall',     keywords: ['a303', 'hall a303', 'lecture a303'] },
  { zoneId: 'F3-A304', name: 'Lecture Hall A304',    floor: '3F',  type: 'hall',     keywords: ['a304', 'hall a304', 'lecture a304'] },
  // 4th floor
  { zoneId: 'F4-A402', name: 'Computer Lab A402',    floor: '4F',  type: 'lab',      keywords: ['a402', 'lab a402', 'computer lab a402'] },
  { zoneId: 'F4-A403', name: 'Computer Lab A403',    floor: '4F',  type: 'lab',      keywords: ['a403', 'lab a403', 'computer lab a403'] },
  { zoneId: 'F4-A404', name: 'Computer Lab A404',    floor: '4F',  type: 'lab',      keywords: ['a404', 'lab a404', 'computer lab a404'] },
  { zoneId: 'F4-A405', name: 'Computer Lab A405',    floor: '4F',  type: 'lab',      keywords: ['a405', 'lab a405', 'computer lab a405'] },
  { zoneId: 'F4-A406', name: 'Lecture Hall A406',    floor: '4F',  type: 'hall',     keywords: ['a406', 'hall a406', 'lecture a406'] },
  // 5th floor
  { zoneId: 'F5-A502', name: 'Lecture Hall A502',    floor: '5F',  type: 'hall',     keywords: ['a502', 'hall a502', 'lecture a502'] },
  { zoneId: 'F5-A503', name: 'Lecture Hall A503',    floor: '5F',  type: 'hall',     keywords: ['a503', 'hall a503', 'lecture a503'] },
  { zoneId: 'F5-STU',  name: 'Study Area',           floor: '5F',  type: 'shared',   keywords: ['study area', 'study room', 'reading room', 'study hall', 'f5 study'] },
  { zoneId: 'F5-LIB',  name: 'Library',              floor: '5F',  type: 'admin',    keywords: ['library', 'lib', 'sliit library'] },
  // 6th floor
  { zoneId: 'F6-MO',   name: 'Main Office',          floor: '6F',  type: 'admin',    keywords: ['main office', 'front office', 'reception', 'f6 office', 'f6-mo'] },
  { zoneId: 'F6-DEAN', name: "Dean's Office",        floor: '6F',  type: 'admin',    keywords: ['dean', "dean's office", 'dean office', 'principal'] },
  { zoneId: 'F6-ASTF', name: 'Academic Staff Room',  floor: '6F',  type: 'admin',    keywords: ['academic staff', 'lecturer room', 'f6 staff', 'astf'] },
  { zoneId: 'F6-DIN',  name: 'Staff Dining Area',    floor: '6F',  type: 'food',     keywords: ['staff dining', 'dining area', 'f6 dining'] },
  // Campus grounds
  { zoneId: 'GRD-FIELD', name: 'Open Ground / Parking', floor: 'GRD', type: 'ground',   keywords: ['ground', 'field', 'outdoor', 'parking', 'campus ground', 'open area'] },
  { zoneId: 'GRD-SEC',   name: 'Security / Main Gate',  floor: 'GRD', type: 'security', keywords: ['security', 'guard room', 'main gate', 'entrance gate', 'grd-sec'] },
];

// Seed default zones into the database if none exist.
// Called once on server startup.
exports.seedZones = async () => {
  try {
    const count = await Zone.countDocuments();
    if (count > 0) return;
    await Zone.insertMany(DEFAULT_ZONES);
    console.log(`[zones] Seeded ${DEFAULT_ZONES.length} default zones.`);
  } catch (err) {
    console.error('[zones] Seed error:', err.message);
  }
};

// GET /api/zones — return all active zones
exports.getZones = async (req, res) => {
  try {
    const zones = await Zone.find({ isActive: true }).sort({ floor: 1, zoneId: 1 }).lean();
    res.json({ success: true, data: zones });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/zones/all — return all zones including inactive (admin view)
exports.getAllZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ floor: 1, zoneId: 1 }).lean();
    res.json({ success: true, data: zones });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/zones — create a new zone
exports.createZone = async (req, res) => {
  try {
    const { zoneId, name, floor, type, keywords } = req.body;
    if (!zoneId || !name || !floor || !type) {
      return res.status(400).json({ success: false, message: 'zoneId, name, floor, and type are required.' });
    }

    const existing = await Zone.findOne({ zoneId });
    if (existing) {
      return res.status(409).json({ success: false, message: `Zone ID "${zoneId}" already exists.` });
    }

    const zone = await Zone.create({
      zoneId: zoneId.trim().toUpperCase(),
      name: name.trim(),
      floor: floor.trim().toUpperCase(),
      type,
      keywords: Array.isArray(keywords)
        ? keywords.map(k => k.trim().toLowerCase()).filter(Boolean)
        : [],
    });
    res.status(201).json({ success: true, data: zone });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/zones/:id — update a zone by MongoDB _id
exports.updateZone = async (req, res) => {
  try {
    const { name, floor, type, keywords, isActive } = req.body;
    const updates = {};
    if (name    !== undefined) updates.name     = name.trim();
    if (floor   !== undefined) updates.floor    = floor.trim().toUpperCase();
    if (type    !== undefined) updates.type     = type;
    if (isActive !== undefined) updates.isActive = isActive;
    if (keywords !== undefined) {
      updates.keywords = Array.isArray(keywords)
        ? keywords.map(k => k.trim().toLowerCase()).filter(Boolean)
        : [];
    }

    const zone = await Zone.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found.' });
    res.json({ success: true, data: zone });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/zones/:id — hard-delete a zone by MongoDB _id
exports.deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found.' });
    res.json({ success: true, message: `Zone "${zone.name}" deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
