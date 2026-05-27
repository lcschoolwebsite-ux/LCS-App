const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  dob:          { type: String, default: "" },        // "ddmmyyyy" stored as string when available
  fatherName:   { type: String, required: true },
  motherName:   { type: String, required: true },
  mobile:       { type: String, required: true },
  alternateMobile: { type: String, default: "" },
  email:        { type: String, default: "" },
  address:      { type: String, default: "" },
  satCode:      { type: String, required: true, unique: true },
  penCode:      { type: String },
  class:        { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  addedBy:      { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  photoUrl:      { type: String, default: "" },
  photoPublicId: { type: String, default: "" },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

studentSchema.index({ isActive: 1, class: 1, academicYear: 1, name: 1 });
studentSchema.index({ isActive: 1, name: 1 });
studentSchema.index({ mobile: 1 });
studentSchema.index({ alternateMobile: 1 });
studentSchema.index(
  { penCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      penCode: { $type: "string", $gt: "" }
    }
  }
);

module.exports = mongoose.model("Student", studentSchema);
