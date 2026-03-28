const express = require("express");
const router = express.Router();
const {
  getAllRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteById,
  getRoutesByStatus
} = require("../controllers/routeController");

// GET /api/routes - Get all routes
router.get("/", getAllRoutes);

// GET /api/routes/:id - Get route by ID
router.get("/:id", getRouteById);

// GET /api/routes/status/:status - Get routes by status (Active/Inactive)
router.get("/status/:status", getRoutesByStatus);

// POST /api/routes - Create new route
router.post("/", createRoute);

// PUT /api/routes/:id - Update route
router.put("/:id", updateRoute);

// DELETE /api/routes/:id - Delete route
router.delete("/:id", deleteRoute);

module.exports = router;