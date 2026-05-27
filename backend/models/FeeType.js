const mongoose = require("mongoose");

const feeTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  createdBy: { type: String, default: "admin" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("FeeType", feeTypeSchema);
