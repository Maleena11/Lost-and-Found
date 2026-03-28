const express = require("express");
const router = express.Router();
const {
  adminSignup,
  adminLogin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
} = require("../controllers/adminController");

// POST /api/auth/signup - Admin signup
router.post("/signup", adminSignup);

// POST /api/auth/login - Admin login
router.post("/login", adminLogin);

// GET /api/auth/admins - Get all admins (for super admin)
router.get("/admins", getAllAdmins);

// GET /api/auth/admins/:id - Get admin by ID
router.get("/admins/:id", getAdminById);

// PUT /api/auth/admins/:id - Update admin
router.put("/admins/:id", updateAdmin);

// DELETE /api/auth/admins/:id - Delete admin
router.delete("/admins/:id", deleteAdmin);

module.exports = router;