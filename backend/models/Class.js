const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  name:          { type: String, required: true },      // "10"
  section:       { type: String, required: true },      // "A"
  academicYear:  { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  classTeacher:  { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  classTeacherSubject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
}, { timestamps: true });

classSchema.index({ academicYear: 1, name: 1, section: 1 }, { unique: true });
classSchema.index({ classTeacher: 1 });

module.exports = mongoose.model("Class", classSchema);
