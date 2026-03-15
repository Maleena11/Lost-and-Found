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
const { sendArchiveNotification } = require('./utils/emailService');

// Load environment variables
dotenv.config();

// Cleanup function — archives urgent expired notices, deletes low/medium expired notices
const cleanupExpiredNotices = async () => {
  try {
    const now = new Date();

    // Find urgent notices that have expired and are not yet archived (bypass pre hook)
    const urgentExpired = await Notice.findWithArchived({
      priority: 'urgent',
      isArchived: { $ne: true },
      endDate: { $exists: true, $lt: now }
    });

    if (urgentExpired.length > 0) {
      // Mark them as archived in the database
      const urgentIds = urgentExpired.map(n => n._id);
      await Notice.collection.updateMany(
        { _id: { $in: urgentIds } },
        { $set: { isArchived: true, archivedAt: now } }
      );
      console.log(`[Notice Cleanup] Archived ${urgentExpired.length} urgent expired notice(s).`);

      // Send email to security/student affairs office for each archived notice
      for (const notice of urgentExpired) {
        sendArchiveNotification(notice).catch(err =>
          console.error(`[Archive Email] Failed for "${notice.title}":`, err.message)
        );
      }
    }

    // Permanently delete low and medium priority expired notices (bypass pre hook)
    const deleted = await Notice.deleteWithArchived({
      priority: { $in: ['low', 'medium'] },
      isArchived: { $ne: true },
      endDate: { $exists: true, $lt: now }
    });
    if (deleted.deletedCount > 0) {
      console.log(`[Notice Cleanup] Deleted ${deleted.deletedCount} low/medium expired notice(s).`);
    }
  } catch (err) {
    console.error('[Notice Cleanup] Error:', err.message);
  }
};

// Connect to database
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
        // Run once on startup, then every 5 minutes
        cleanupExpiredNotices();
        setInterval(cleanupExpiredNotices, 5 * 60 * 1000);
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
