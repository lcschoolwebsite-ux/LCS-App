const Teacher = require("../models/Teacher");
const {
  normalizeIdList,
  syncTeacherAssignments,
  syncTeacherClassAccess
} = require("../utils/classAssignmentSync");

const compactRefs = value => (Array.isArray(value) ? value.filter(Boolean) : value);

const hydrateTeacher = teacher => {
  if (!teacher) return teacher;
  const data = teacher.toObject ? teacher.toObject() : { ...teacher };
  data.assignedClasses = compactRefs(data.assignedClasses);
  data.assignedSubjects = compactRefs(data.assignedSubjects);
  return data;
};

const normalizeTeacherPayload = body => {
  const payload = { ...body };

  ["name", "username", "password", "email", "phone"].forEach(field => {
    if (typeof payload[field] === "string") payload[field] = payload[field].trim();
  });

  if (!payload.password) delete payload.password;
  return payload;
};

exports.getAll = async (req, res) =>
  res.json(
    (await Teacher.find({ isActive: true })
      .select("-password")
      .populate("assignedClasses", "name section")
      .populate("assignedSubjects", "name")).map(hydrateTeacher)
  );

exports.create = async (req, res) => {
  try {
    const payload = normalizeTeacherPayload(req.body);
    if (!payload.password || payload.password.length < 6) {
      return res.status(400).json({ message: "Teacher password must be at least 6 characters" });
    }

    const t = await Teacher.create(payload);
    res.status(201).json({ ...t.toObject(), password: undefined });
  } catch (e) {
    const message = e.code === 11000 ? "Teacher username already exists" : e.message;
    res.status(400).json({ message });
  }
};

exports.update = async (req, res) => {
  try {
    const payload = normalizeTeacherPayload(req.body);
    if (payload.password && payload.password.length < 6) {
      return res.status(400).json({ message: "Teacher password must be at least 6 characters" });
    }

    if (payload.password) {
      const t = await Teacher.findById(req.params.id);
      if (!t) return res.status(404).json({ message: "Teacher not found" });
      t.set(payload);
      await t.save();
      const updated = await Teacher.findById(t._id).select("-password").populate("assignedClasses","name section").populate("assignedSubjects","name");
      return res.json(hydrateTeacher(updated));
    }
    const t = await Teacher.findByIdAndUpdate(req.params.id, payload, { new: true }).select("-password").populate("assignedClasses","name section").populate("assignedSubjects","name");
    if (!t) return res.status(404).json({ message: "Teacher not found" });
    res.json(hydrateTeacher(t));
  } catch (e) {
    const message = e.code === 11000 ? "Teacher username already exists" : e.message;
    res.status(400).json({ message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Teacher.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Deactivated" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.assignClass = async (req, res) => {
  try {
    const t = await Teacher.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Teacher not found" });

    const classIds = normalizeIdList(req.body.classIds || req.body.classId);
    const existingIds = normalizeIdList(t.assignedClasses);
    const mergedIds = [...new Set([...existingIds, ...classIds])];

    t.assignedClasses = mergedIds;
    await t.save();
    await syncTeacherAssignments(t._id, mergedIds);

    const updated = await Teacher.findById(t._id)
      .select("-password")
      .populate("assignedClasses", "name section")
      .populate("assignedSubjects", "name");
    res.json({ message: "Classes assigned", teacher: hydrateTeacher(updated) });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.setClasses = async (req, res) => {
  try {
    const classIds = normalizeIdList(req.body.classIds);
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    teacher.assignedClasses = classIds;
    await teacher.save();
    await syncTeacherAssignments(teacher._id, classIds);

    const t = await Teacher.findById(teacher._id)
      .select("-password")
      .populate("assignedClasses", "name section")
      .populate("assignedSubjects", "name");

    res.json({ message: "Class assignments updated", teacher: hydrateTeacher(t) });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.assignSubject = async (req, res) => {
  try {
    const t = await Teacher.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Teacher not found" });
    if (!t.assignedSubjects.includes(req.body.subjectId))
      t.assignedSubjects.push(req.body.subjectId);
    await t.save();
    await syncTeacherClassAccess(t._id);
    res.json({ message: "Subject assigned" });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.resetPassword = async (req, res) => {
  try {
    if (!req.body.password || req.body.password.trim().length < 6) {
      return res.status(400).json({ message: "Teacher password must be at least 6 characters" });
    }
    const t = await Teacher.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Teacher not found" });
    t.password = req.body.password.trim();
    await t.save();
    res.json({ message: "Password reset successful" });
  } catch (e) { res.status(400).json({ message: e.message }); }
};
