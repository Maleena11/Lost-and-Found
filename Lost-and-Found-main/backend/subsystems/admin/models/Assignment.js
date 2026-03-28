const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicles", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Employees", required: true },
  conductor: { type: mongoose.Schema.Types.ObjectId, ref: "Employees" },
  cleaner: { type: mongoose.Schema.Types.ObjectId, ref: "Employees", required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true }
}, { timestamps: true });

// Explicitly point to the correct collection name
module.exports = mongoose.model("Assignments", assignmentSchema, "assignments");