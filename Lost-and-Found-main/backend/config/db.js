// config/db.js
const mongoose = require("mongoose");
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

mongoose.set("strictQuery", true);

const connection = async () => {
  try {
    const dburl = process.env.MONGO_URI;
    if (!dburl) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(dburl);

    console.log("✅ MongoDB Connected successfully");
  } catch (e) {
    console.error("❌ MongoDB connection error:", e.message);
    process.exit(1);
  }
};

module.exports = connection;
