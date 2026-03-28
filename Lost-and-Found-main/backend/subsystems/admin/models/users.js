const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phonenumber: { type: String },
  street: { type: String },
  city: { type: String },
  role: { type: String, enum: ["User", "Admin"], default: "User" },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model("User", userSchema);
