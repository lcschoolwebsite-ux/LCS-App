const mongoose = require("mongoose");

const studentLoginLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  studentName: { type: String, required: true },
  satCode: { type: String, required: true },
  className: { type: String, default: "" },
  academicYear: { type: String, default: "" }
}, {
  timestamps: true
});

studentLoginLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

module.exports = mongoose.model("StudentLoginLog", studentLoginLogSchema);
