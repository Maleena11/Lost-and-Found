const RouteModel = require("../models/Route");

// Get all routes
const getAllRoutes = async (req, res) => {
  try {
    const routes = await RouteModel.find();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new route
const createRoute = async (req, res) => {
  try {
    console.log("Received route data:", req.body);
    const newRoute = new RouteModel(req.body);
    console.log("Created route object:", newRoute);
    await newRoute.save();
    res.status(201).json(newRoute);
  } catch (err) {
    console.error("Route creation error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// Update route
const updateRoute = async (req, res) => {
  try {
    const updatedRoute = await RouteModel.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    if (!updatedRoute) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.json(updatedRoute);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete route
const deleteRoute = async (req, res) => {
  try {
    const deletedRoute = await RouteModel.findByIdAndDelete(req.params.id);
    if (!deletedRoute) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.json({ message: "Route deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get route by ID
const getRouteById = async (req, res) => {
  try {
    const route = await RouteModel.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get routes by status
const getRoutesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be 'Active' or 'Inactive'" });
    }
    
    const routes = await RouteModel.find({ status });
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteById,
  getRoutesByStatus
};