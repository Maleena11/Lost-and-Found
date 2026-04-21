const express = require('express');
const router = express.Router();
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem,
  searchItems,
  getHeatmapData,
  addSighting,
  reactToSighting,
  updateSighting,
  deleteSighting,
  getSightingNotifications,
  markSightingNotificationRead,
} = require('../controllers/lostFoundController');

// Get all items and create new item
router
  .route('/')
  .get(getAllItems)
  .post(createItem);

// Search endpoint
router.get('/search', searchItems);

// Heatmap data endpoint
router.get('/heatmap', getHeatmapData);

// Get, update, and delete specific item
router
  .route('/:id')
  .get(getItemById)
  .put(updateItem)
  .delete(deleteItem);

// Update item status
router.patch('/:id/status', updateItemStatus);

// Sighting notifications (must be before /:id routes to avoid ID clash)
router.get('/sighting-notifications/:email', getSightingNotifications);
router.patch('/sighting-notifications/:notifId/read', markSightingNotificationRead);

// Sightings on a specific item
router.post('/:id/sightings', addSighting);
router.patch('/:id/sightings/:sightingId', reactToSighting);
router.put('/:id/sightings/:sightingId', updateSighting);
router.delete('/:id/sightings/:sightingId', deleteSighting);

module.exports = router;
