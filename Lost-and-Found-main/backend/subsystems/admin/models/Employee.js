const mongoose = require("mongoose");

// Employee Schema
const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },

  role: { type: String, enum: ["Driver", "Conductor", "Cleaner"], required: true },

  contact: { 
    type: String, 
    required: true, 
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit contact number!`
    }
  },

  address: { type: String },

  nic: { 
    type: String, 
    required: true, 
    validate: {
      validator: function(v) {
        // Old NIC: 9 digits + V/v, New NIC: 12 digits
        return /^(\d{9}[vV]|\d{12})$/.test(v);
      },
      message: props => `${props.value} is not a valid NIC number!`
    }
  },

  licenseNo: { 
    type: String, 
    required: function() { return this.role === "Driver"; },
    validate: {
      validator: function(v) {
        if (this.role !== "Driver") return true;
        const normalized = v.replace(/[\s-]/g, ""); // remove spaces/dashes
        return /^[A-Z]{1}\d{7}$/.test(normalized); // 1 letter + 7 digits
      },
      message: props => `${props.value} is not a valid Sri Lankan driver license number (1 letter + 7 digits)!`
    }
  },

  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("Employees", employeeSchema);
