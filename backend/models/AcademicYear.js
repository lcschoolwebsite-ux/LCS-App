const mongoose = require("mongoose");

module.exports = mongoose.model("AcademicYear", new mongoose.Schema({
  year:      { type: String, required: true, unique: true }, // "2025-26"
  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },
  isActive:  { type: Boolean, default: false }
}, { timestamps: true }));
