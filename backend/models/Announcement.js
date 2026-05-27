const mongoose = require("mongoose");

module.exports = mongoose.model("Announcement", new mongoose.Schema({
  title:        { type: String, required: true },
  content:      { type: String, required: true },
  audience:     { type: String, enum: ["all","student","teacher"], default: "all" },
  class:        { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear" },
  pinned:       { type: Boolean, default: false },
  createdBy:    { type: String, default: "admin" },
}, { timestamps: true }));
