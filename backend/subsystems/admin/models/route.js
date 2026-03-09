const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: [true, "Route number is required"],
    unique: true,
    uppercase: true,
    match: [/^[A-Z]{1}[0-9]{2,4}$/, "Route number must start with a letter followed by 2-4 digits (e.g., R101)"]
  },
  name: {
    type: String,
    required: [true, "Route name is required"],
  },
  startLocation: {
    type: String,
    required: [true, "Start location is required"],
  },
  endLocation: {
    type: String,
    required: [true, "End location is required"],
  },
  distanceKm: {
    type: Number,
    required: [true, "Distance in kilometers is required"],
    min: [0.1, "Distance must be greater than 0"]
  },
  stops: {
    type: Number,
    required: [true, "Number of stops is required"],
    min: [1, "Stops must be at least 1"],
    default: 1
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
}, {
  timestamps: true, // Optional: adds createdAt and updatedAt fields
});

module.exports = mongoose.models.Route || mongoose.model("Route", routeSchema);
