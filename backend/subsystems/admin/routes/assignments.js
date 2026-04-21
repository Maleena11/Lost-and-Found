const express = require("express");
const Assignment = require("../models/Assignment");
const Vehicle = require("../models/Vehicle");
const Employee = require("../models/Employee");
const Route = require("../models/Route");

const router = express.Router();

// ✅ CREATE Assignment
router.post("/", async (req, res) => {
  try {
    const { vehicle, driver, conductor, cleaner, route } = req.body;

    // --- Validations ---
    if (!vehicle || !driver || !cleaner || !route) {
      return res.status(400).json({ message: "Vehicle, driver, cleaner, and route are required." });
    }

    // Check if related documents exist
    const vehicleObj = await Vehicle.findById(vehicle);
    if (!vehicleObj) return res.status(400).json({ message: "Vehicle not found." });

    const driverObj = await Employee.findById(driver);
    if (!driverObj) return res.status(400).json({ message: "Driver not found." });

    const cleanerObj = await Employee.findById(cleaner);
    if (!cleanerObj) return res.status(400).json({ message: "Cleaner not found." });

    const routeObj = await Route.findById(route);
    if (!routeObj) return res.status(400).json({ message: "Route not found." });

    // If vehicle is a bus → conductor is required
    if (vehicleObj.vehicleType === "Bus" && !conductor) {
      return res.status(400).json({ message: "Conductor is required for buses." });
    }

    // Create and save new assignment
    const assignment = new Assignment({ vehicle, driver, conductor, cleaner, route });
    await assignment.save();
    res.status(201).json(assignment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ READ → Get all assignments
router.get("/", async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("vehicle")
      .populate("driver")
      .populate("conductor")
      .populate("cleaner")
      .populate("route"); // populate = replace IDs with actual data
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ READ → Get single assignment by ID
router.get("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("vehicle")
      .populate("driver")
      .populate("conductor")
      .populate("cleaner")
      .populate("route");
    if (!assignment) return res.status(404).json({ message: "Assignment not found." });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE assignment
router.put("/:id", async (req, res) => {
  try {
    const { vehicle, driver, conductor, cleaner, route } = req.body;

    if (!vehicle || !driver || !cleaner || !route) {
      return res.status(400).json({ message: "Vehicle, driver, cleaner, and route are required." });
    }

    const vehicleObj = await Vehicle.findById(vehicle);
    if (!vehicleObj) return res.status(400).json({ message: "Vehicle not found." });

    if (vehicleObj.vehicleType === "Bus" && !conductor) {
      return res.status(400).json({ message: "Conductor is required for buses." });
    }

    // Update and return new assignment
    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Assignment not found." });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ DELETE assignment
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Assignment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Assignment not found." });
    res.json({ message: "Assignment deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
