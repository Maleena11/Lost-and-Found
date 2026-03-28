const express = require("express");
const router = express.Router();

// Import all route modules
const userRoutes = require("./userRoutes");
const itemRoutes = require("./itemRoutes");
const routeRoutes = require("./routeRoutes");
const authRoutes = require("./authRoutes");
const chatRoutes = require("./chatRoutes");

// Define route prefixes
router.use("/users", userRoutes);
router.use("/items", itemRoutes);
router.use("/routes", routeRoutes);
router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Lost and Found API is running",
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Lost and Found System API",
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      items: "/api/items",
      routes: "/api/routes",
      auth: "/api/auth",
      chat: "/api/chat",
      health: "/api/health"
    }
  });
});

module.exports = router;