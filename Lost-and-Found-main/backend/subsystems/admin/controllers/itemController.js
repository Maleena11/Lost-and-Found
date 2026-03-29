const ItemModel = require("../models/item");

// Get all items
const getAllItems = async (req, res) => {
  try {
    const items = await ItemModel.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new item
const createItem = async (req, res) => {
  try {
    const newItem = new ItemModel(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// Update item
const updateItem = async (req, res) => {
  try {
    const updatedItem = await ItemModel.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete item
const deleteItem = async (req, res) => {
  try {
    const deletedItem = await ItemModel.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get item by ID
const getItemById = async (req, res) => {
  try {
    const item = await ItemModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get items by status (Lost or Found)
const getItemsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    if (!["Lost", "Found"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'Lost' or 'Found'" });
    }
    
    const items = await ItemModel.find({ status });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get items by category
const getItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const items = await ItemModel.find({ category });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllItems,
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  getItemsByStatus,
  getItemsByCategory
};