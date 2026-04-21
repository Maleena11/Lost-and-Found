require("dotenv").config();
const express = require("express");
const dbConnection = require("./config/db");
const cors = require("cors");
const bodyParser = require("body-parser");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./middleware/logger");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const alertRoutes = require("./subsystems/admin/routes/alerts");

// Import Admin model (make sure this exists)
const Admin = require("./subsystems/admin/models/admin");

// Routes
const employeeRoutes = require("./subsystems/admin/routes/Employees");
const vehicleRoutes = require("./subsystems/admin/routes/Vehicles");
const routeRoutes = require("./subsystems/admin/routes/routes");
const assignmentRoutes = require("./subsystems/admin/routes/assignments");
const userRoutes = require("./subsystems/admin/routes/userRoutes");
const itemRoutes = require("./subsystems/admin/routes/itemRoutes");
const RouteRoutes = require("./subsystems/admin/routes/routeRoutes");
const authRoutes = require("./subsystems/admin/routes/authRoutes");
const chatRoutes = require("./subsystems/admin/routes/chatRoutes");
const lostFoundRoutes = require('./subsystems/lost-found-reporting/routes/lostFoundRoutes');
const noticeRoutes = require('./subsystems/notice-management/routes/noticeRoutes');
const verificationRoutes = require('./subsystems/claim-verification/routes/verificationRoutes');
const notificationRoutes = require('./subsystems/claim-verification/routes/notificationRoutes');

const { Server } = require("socket.io");
const http = require("http");

const app = express(); 

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  }
});

app.set('io', io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  
  socket.on("join_notifications", (email) => {
    if (email) {
      socket.join(email.toLowerCase());
      console.log(`Socket ${socket.id} joined room: ${email}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(logger);

// DB Connection
dbConnection();

// Admin creation function
async function createAdmin() {
  try {
    const username = "admin";           
    const password = "admin@123";       

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({ 
      username, 
      password: hashedPassword
    });
    
    await admin.save();
    console.log("Admin created successfully!");
  } catch (err) {
    console.error("Error creating admin:", err);
  }
}

// Call createAdmin after database connection is established
mongoose.connection.once('open', async () => {
  console.log("Connected to MongoDB");
  await createAdmin();
});

app.get("/", (req, res) => res.send("Hello World"));

// Register routes
app.use("/api/employees", employeeRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/alerts", alertRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/items", itemRoutes);
app.use("/routes", RouteRoutes);
app.use("/signup", authRoutes);
app.use("/login", authRoutes);
app.use("/chat", chatRoutes);
app.use(errorHandler);
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));