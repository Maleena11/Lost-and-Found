const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');  // Add this line
const connectDB = require('./config/db');  // Import db.js to connect to the database
const lostFoundRoutes = require('./subsystems/lost-found-reporting/routes/lostFoundRoutes');
// Require the routes
const noticeRoutes = require('./subsystems/notice-management/routes/noticeRoutes');
const routeRoutes = require('./subsystems/admin/routes/routeRoutes');
const userRoutes = require('./subsystems/admin/routes/userRoutes');
const notificationRoutes = require('./subsystems/claim-verification/routes/notificationRoutes');
const errorHandler = require('./middleware/errorHandler');
const { default: mongoose } = require('mongoose');
const Notice = require('./subsystems/notice-management/models/Notice');

// Load environment variables
dotenv.config();

// Cleanup function — deletes notices whose endDate has passed
const cleanupExpiredNotices = async () => {
  try {
    const result = await Notice.deleteMany({
      endDate: { $exists: true, $lt: new Date() }
    });
    if (result.deletedCount > 0) {
      console.log(`[Notice Cleanup] Removed ${result.deletedCount} expired notice(s).`);
    }
  } catch (err) {
    console.error('[Notice Cleanup] Error:', err.message);
  }
};

// Connect to database
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
        // Run once on startup, then every hour
        cleanupExpiredNotices();
        setInterval(cleanupExpiredNotices, 60 * 60 * 1000);
    })
    .catch(err => console.log(err));

// Create express app
const app = express();

// CORS middleware - Add this before your routes
app.use(cors({
  origin: 'http://localhost:5173',  // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// Middleware to parse JSON
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/lost-found', lostFoundRoutes);
// Use the routes
app.use('/api/notices', noticeRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
