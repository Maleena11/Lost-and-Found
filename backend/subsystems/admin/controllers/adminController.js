const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");

// Admin signup
const adminSignup = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ error: "Username already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new admin
    const newAdmin = new Admin({ 
      username, 
      password: hashedPassword 
    });
    
    await newAdmin.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.status(200).json({ 
      message: "Login successfully",
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all admins (for super admin functionality)
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password'); // Exclude password from response
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get admin by ID
const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update admin
const updateAdmin = async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    // If password is being updated, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    
    res.json(updatedAdmin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete admin
const deleteAdmin = async (req, res) => {
  try {
    const deletedAdmin = await Admin.findByIdAndDelete(req.params.id);
    if (!deletedAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  adminSignup,
  adminLogin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
};