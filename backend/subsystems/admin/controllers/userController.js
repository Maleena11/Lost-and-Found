const UserModel = require("../models/users");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find();
    
    // Map the data to frontend format
    const mappedUsers = users.map(user => ({
      _id: user._id,
      id: user._id,
      name: user.fullname,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    res.json(mappedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    console.log("Received user data: ", req.body); // Debug log
    
    // Map frontend fields to backend fields
    const userData = {
      fullname: req.body.name || req.body.fullname,
      email: req.body.email,
      password: req.body.password || "defaultPassword123", // You might want to generate a random password
      phonenumber: req.body.phonenumber,
      street: req.body.street,
      city: req.body.city,
      role: req.body.role || "User",
      status: req.body.status || "Active"
    };
    
    const newUser = new UserModel(userData);
    await newUser.save();
    console.log("User saved successfully:", newUser); // Debug log
    
    // Return user data with mapped fields for frontend compatibility
    const responseUser = {
      _id: newUser._id,
      id: newUser._id,
      name: newUser.fullname,
      fullname: newUser.fullname,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };
    
    res.status(201).json(responseUser);
  } catch (err) {
    console.error("Error details:", err); // More detailed error logging
    
    // Handle specific MongoDB errors
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ error: err.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    // Map frontend fields to backend fields
    const updateData = {
      fullname: req.body.name || req.body.fullname,
      email: req.body.email,
      role: req.body.role,
      status: req.body.status
    };

    // Only include password if it's provided
    if (req.body.password) {
      updateData.password = req.body.password;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return user data with mapped fields for frontend compatibility
    const responseUser = {
      _id: updatedUser._id,
      id: updatedUser._id,
      name: updatedUser.fullname,
      fullname: updatedUser.fullname,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
    
    res.json(responseUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return user data with mapped fields for frontend compatibility
    const responseUser = {
      _id: user._id,
      id: user._id,
      name: user.fullname,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json(responseUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserById
};