const express = require("express");
const Route = require("../models/Route");
const router = express.Router();

// ✅ CREATE new route
router.post("/", async (req, res) => {
  try {
    const { routeNumber, name, startLocation, endLocation, distanceKm, stops, status } = req.body;

    console.log("Received route data:", req.body);

    // --- Validations ---
    if (!/^[A-Z]{1}[0-9]{2,4}$/.test(routeNumber)) {
      return res.status(400).json({ message: "Route number must start with a letter followed by 2-4 digits (e.g., R101)" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Route name is required" });
    }

    if (!startLocation || !endLocation) {
      return res.status(400).json({ message: "Start and End locations are required" });
    }

    if (!distanceKm || distanceKm <= 0) {
      return res.status(400).json({ message: "Distance must be a positive number" });
    }

    if (!stops || stops <= 0) {
      return res.status(400).json({ message: "Number of stops must be at least 1" });
    }

    // Save route
    const route = new Route({ 
      routeNumber, 
      name: name.trim(), 
      startLocation, 
      endLocation, 
      distanceKm, 
      stops,
      status 
    });
    await route.save();
    res.status(201).json(route);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ READ → Get all routes
router.get("/", async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ READ → Get single route by ID
router.get("/:id", async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json(route);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE route
router.put("/:id", async (req, res) => {
  try {
    const { routeNumber, startLocation, endLocation, distanceKm, status } = req.body;

    // Validate route number format
    if (routeNumber && !/^[A-Z]{1}[0-9]{2,4}$/.test(routeNumber)) {
      return res.status(400).json({ message: "Route number must start with a letter followed by 2-4 digits (e.g., R101)" });
    }

    // Validate distance
    if (distanceKm && distanceKm <= 0) {
      return res.status(400).json({ message: "Distance must be a positive number" });
    }

    // Update and return updated route
    const updatedRoute = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRoute) return res.status(404).json({ message: "Route not found" });

    res.json(updatedRoute);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ DELETE route
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Route.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Route not found" });
    res.json({ message: "Route deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
