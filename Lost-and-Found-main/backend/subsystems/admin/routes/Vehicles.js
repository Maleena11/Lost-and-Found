const express = require("express");
const Vehicle = require("../models/Vehicle");

const router = express.Router();

// ✅ CREATE Vehicle
router.post("/", async (req, res) => {
  try {
    const { vehicleType, vehicleId, plateNo, capacity, status } = req.body;

    if (!["Bus", "Train"].includes(vehicleType)) {
      return res.status(400).json({ message: "Invalid vehicle type" });
    }

    if (!/^[A-Z]{1}[0-9]{4}$/.test(vehicleId)) {
      return res.status(400).json({ message: "Vehicle ID must be B0001 format (1 letter + 4 digits)" });
    }

    if (!/^[A-Z]{3}-[0-9]{3}$/.test(plateNo)) {
      return res.status(400).json({ message: "Plate No must be XXX-123 format (3 letters + dash + 3 digits)" });
    }

    if (!capacity || capacity < 1 || capacity > 2000) {
      return res.status(400).json({ message: "Capacity must be between 1 and 2000" });
    }

    const vehicle = new Vehicle({ vehicleType, vehicleId, plateNo, capacity, status });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ READ all vehicles
router.get("/", async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ READ one vehicle
router.get("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Not found" });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE Vehicle
router.put("/:id", async (req, res) => {
  try {
    const { vehicleType, vehicleId, plateNo, capacity, status } = req.body;

    if (vehicleType && !["Bus", "Train"].includes(vehicleType)) {
      return res.status(400).json({ message: "Invalid vehicle type" });
    }

    if (vehicleId && !/^[A-Z]{1}[0-9]{4}$/.test(vehicleId)) {
      return res.status(400).json({ message: "Vehicle ID must be B0001 format (1 letter + 4 digits)" });
    }

    if (plateNo && !/^[A-Z]{3}-[0-9]{3}$/.test(plateNo)) {
      return res.status(400).json({ message: "Plate No must be XXX-123 format (3 letters + dash + 3 digits)" });
    }

    if (capacity && (capacity < 1 || capacity > 2000)) {
      return res.status(400).json({ message: "Capacity must be between 1 and 2000" });
    }

    const updated = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Not found" });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ DELETE Vehicle
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Vehicle deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
