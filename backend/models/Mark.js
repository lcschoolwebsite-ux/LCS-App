const mongoose = require("mongoose");

const markSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  exam:         { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  subject:      { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  marksObtained:{ type: Number, default: 0 },
  isAbsent:     { type: Boolean, default: false },
  grade:        { type: String, default: "" },
  enteredBy:    { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
}, { timestamps: true });

markSchema.index({ student: 1, exam: 1, subject: 1 }, { unique: true });
markSchema.index({ exam: 1, student: 1 });
markSchema.index({ academicYear: 1, subject: 1 });

markSchema.pre("save", function (next) {
  if (this.isAbsent) { this.grade = "AB"; return next(); }
  const p = this.marksObtained;
  if      (p >= 90) this.grade = "A+";
  else if (p >= 80) this.grade = "A";
  else if (p >= 70) this.grade = "B+";
  else if (p >= 60) this.grade = "B";
  else if (p >= 50) this.grade = "C";
  else if (p >= 35) this.grade = "D";
  else              this.grade = "F";
  next();
});

module.exports = mongoose.model("Mark", markSchema);
