const Class = require("../models/Class");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Exam = require("../models/Exam");
const Attendance = require("../models/Attendance");
const FeeStructure = require("../models/FeeStructure");
const Teacher = require("../models/Teacher");
const {
  syncClassTeacher
} = require("../utils/classAssignmentSync");

const normalizeClassPayload = body => {
  const payload = { ...body };
  if (typeof payload.name === "string") payload.name = payload.name.trim();
  if (typeof payload.section === "string") payload.section = payload.section.trim();
  return payload;
};

const duplicateClassMessage = () =>
  "A class with the same academic year, name, and section already exists.";

exports.getAll = async (req, res) => {
  const { academicYear } = req.query;
  const q = academicYear ? { academicYear } : {};
  res.json(await Class.find(q).populate("academicYear","year").populate("classTeacher","name"));
};

exports.create = async (req, res) => {
  try {
    const payload = normalizeClassPayload(req.body);
    const created = await Class.create(payload);
    if (created.classTeacher) {
      await syncClassTeacher(created._id, created.classTeacher);
    }
    res.status(201).json(
      await Class.findById(created._id)
        .populate("academicYear", "year")
        .populate("classTeacher", "name")
    );
  }
  catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: duplicateClassMessage() });
    }
    res.status(400).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const payload = normalizeClassPayload(req.body);
    const existing = await Class.findById(req.params.id).select("classTeacher");
    if (!existing) return res.status(404).json({ message: "Class not found" });

    const updated = await Class.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!updated) return res.status(404).json({ message: "Class not found" });
    if (Object.prototype.hasOwnProperty.call(payload, "classTeacher")) {
      await syncClassTeacher(updated._id, payload.classTeacher || null, existing.classTeacher || null);
    } else if (updated.classTeacher) {
      await syncClassTeacher(updated._id, updated.classTeacher, existing.classTeacher || null);
    }

    const refreshed = await Class.findById(updated._id)
      .populate("academicYear", "year")
      .populate("classTeacher", "name");

    res.json(refreshed);
  }
  catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: duplicateClassMessage() });
    }
    res.status(400).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    const [
      studentCount,
      subjectCount,
      examCount,
      attendanceCount,
      feeStructureCount
    ] = await Promise.all([
      Student.countDocuments({ class: classDoc._id }),
      Subject.countDocuments({ class: classDoc._id }),
      Exam.countDocuments({ class: classDoc._id }),
      Attendance.countDocuments({ class: classDoc._id }),
      FeeStructure.countDocuments({ class: classDoc._id })
    ]);

    const blockingRefs = [
      [studentCount, "students"],
      [subjectCount, "subjects"],
      [examCount, "exams"],
      [attendanceCount, "attendance records"],
      [feeStructureCount, "fee structures"]
    ].filter(([count]) => count > 0);

    if (blockingRefs.length > 0) {
      const labels = blockingRefs.map(([count, label]) => `${count} ${label}`).join(", ");
      return res.status(409).json({
        message: `This class cannot be deleted because it is still used by ${labels}.`
      });
    }

    await Teacher.updateMany(
      { assignedClasses: classDoc._id },
      { $pull: { assignedClasses: classDoc._id } }
    );

    if (classDoc.classTeacher) {
      await Teacher.findByIdAndUpdate(classDoc.classTeacher, {
        $pull: { assignedClasses: classDoc._id }
      });
    }

    await Class.findByIdAndDelete(classDoc._id);
    res.json({ message: "Deleted" });
  }
  catch (e) { res.status(500).json({ message: e.message }); }
};
