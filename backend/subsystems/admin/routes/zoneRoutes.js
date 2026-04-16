const express = require('express');
const router  = express.Router();
const {
  getZones,
  getAllZones,
  createZone,
  updateZone,
  deleteZone,
} = require('../controllers/zoneController');

router.get('/',     getZones);      // active zones only (used by heatmap)
router.get('/all',  getAllZones);   // all zones incl. inactive (admin table)
router.post('/',    createZone);
router.put('/:id',  updateZone);
router.delete('/:id', deleteZone);

module.exports = router;
