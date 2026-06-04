const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema({
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  eventName: { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

holidaySchema.index({ academicYear: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Holiday", holidaySchema);
