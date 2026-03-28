const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  vehicleType: { 
    type: String, 
    enum: ["Bus", "Train"], 
    required: [true, "Vehicle type is required"]
  },

  // Vehicle ID: B0001 format (1 uppercase letter + 4 digits)
  vehicleId: { 
    type: String, 
    required: [true, "Vehicle ID is required"], 
    unique: true,
    validate: {
      validator: v => /^[A-Z]{1}[0-9]{4}$/.test(v),
      message: props => `Vehicle ID '${props.value}' is invalid. Format must be B0001 (1 letter + 4 digits)`
    }
  },

  // Plate number: Any 3 letters + dash + 3 digits
  plateNo: { 
    type: String, 
    required: [true, "Plate No is required"], 
    unique: true,
    validate: {
      validator: v => /^[A-Z]{3}-[0-9]{3}$/.test(v),
      message: props => `Plate No '${props.value}' is invalid. Format must be XXX-123`
    }
  },

  capacity: { 
    type: Number, 
    required: [true, "Capacity is required"],
    min: [1, "Capacity must be at least 1"], 
    max: [2000, "Capacity cannot exceed 2000"] 
  },

  status: { 
    type: String, 
    enum: {
      values: ["Active", "Inactive", "Maintenance"],
      message: "Status must be Active, Inactive, or Maintenance"
    },
    default: "Active"
  }
}, { timestamps: true });

// ✅ Prevent model overwrite on nodemon restart
module.exports = mongoose.models.Vehicle || mongoose.model("Vehicles", vehicleSchema,"vehicles");
