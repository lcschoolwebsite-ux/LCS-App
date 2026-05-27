const mongoose = require("mongoose");

module.exports = mongoose.model("Subject", new mongoose.Schema({
  name:         { type: String, required: true },
  class:        { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  teacher:      { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
}, { timestamps: true }));
