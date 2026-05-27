const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");

const populateSubject = query =>
  query.populate("class","name section").populate("teacher","name").populate("academicYear","year");

const normalizeSubjectPayload = body => {
  const payload = { ...body };
  if (typeof payload.name === "string") payload.name = payload.name.trim();
  if (!payload.teacher) delete payload.teacher;
  return payload;
};

const syncTeacherSubjectAssignment = async (subjectId, teacherId) => {
  await Teacher.updateMany(
    { assignedSubjects: subjectId },
    { $pull: { assignedSubjects: subjectId } }
  );

  if (teacherId) {
    await Teacher.findByIdAndUpdate(teacherId, { $addToSet: { assignedSubjects: subjectId } });
  }
};

exports.getAll = async (req, res) => {
  const { classId, academicYear } = req.query;
  const q = {};
  if (classId)      q.class = classId;
  if (academicYear) q.academicYear = academicYear;
  res.json(await populateSubject(Subject.find(q)));
};

exports.create = async (req, res) => {
  try {
    const payload = normalizeSubjectPayload(req.body);
    const subject = await Subject.create(payload);
    await syncTeacherSubjectAssignment(subject._id, payload.teacher);
    res.status(201).json(await populateSubject(Subject.findById(subject._id)));
  }
  catch (e) { res.status(400).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const payload = normalizeSubjectPayload(req.body);
    const update = { $set: payload };

    if (!req.body.teacher) {
      update.$unset = { teacher: "" };
    }

    const subject = await Subject.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    await syncTeacherSubjectAssignment(subject._id, payload.teacher || null);
    res.json(await populateSubject(Subject.findById(subject._id)));
  }
  catch (e) { res.status(400).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    await Teacher.updateMany(
      { assignedSubjects: subject._id },
      { $pull: { assignedSubjects: subject._id } }
    );
    res.json({ message: "Deleted" });
  }
  catch (e) { res.status(500).json({ message: e.message }); }
};
