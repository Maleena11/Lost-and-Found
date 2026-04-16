const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema(
  {
    zoneId:   { type: String, required: true, unique: true, trim: true },
    name:     { type: String, required: true, trim: true },
    floor:    { type: String, required: true, trim: true },
    type:     {
      type: String,
      required: true,
      enum: ['hall', 'lab', 'food', 'admin', 'shared', 'sis', 'ground', 'security'],
    },
    keywords: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Zone', zoneSchema);
