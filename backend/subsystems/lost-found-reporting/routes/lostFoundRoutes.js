const express = require('express');
const router = express.Router();
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem,
  searchItems
} = require('../controllers/lostFoundController');

// Get all items and create new item
router
  .route('/')
  .get(getAllItems)
  .post(createItem);

// Search endpoint
router.get('/search', searchItems);

// Get, update, and delete specific item
router
  .route('/:id')
  .get(getItemById)
  .put(updateItem)
  .delete(deleteItem);

// Update item status
router.patch('/:id/status', updateItemStatus);



module.exports = router;