const mongoose = require("mongoose");

const examTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true, default: "" },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("ExamType", examTypeSchema);
