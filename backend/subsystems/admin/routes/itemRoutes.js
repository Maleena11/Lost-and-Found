const express = require("express");
const router = express.Router();
const {
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  getItemsByStatus,
  getItemsByCategory
} = require("../controllers/itemController");

// GET /api/items - Get all items
router.get("/", getAllItems);

// GET /api/items/:id - Get item by ID
router.get("/:id", getItemById);

// GET /api/items/status/:status - Get items by status (Lost/Found)
router.get("/status/:status", getItemsByStatus);

// GET /api/items/category/:category - Get items by category
router.get("/category/:category", getItemsByCategory);

// POST /api/items - Create new item
router.post("/", createItem);

// PUT /api/items/:id - Update item
router.put("/:id", updateItem);

// DELETE /api/items/:id - Delete item
router.delete("/:id", deleteItem);

module.exports = router;