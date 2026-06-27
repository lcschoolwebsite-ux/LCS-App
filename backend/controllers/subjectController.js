const Subject = require("../models/Subject");
const Class = require("../models/Class");
const Teacher = require("../models/Teacher");
const { getTeacherAccessState, canAccessClass } = require("../utils/teacherAccess");
const { syncTeacherClassAccess } = require("../utils/classAssignmentSync");

const populateSubject = query =>
  query.populate("class","name section").populate("teacher","name phone").populate("academicYear","year");

const normalizeSubjectPayload = body => {
  const payload = { ...body };
  if (typeof payload.name === "string") payload.name = payload.name.trim();
  if (!payload.teacher) delete payload.teacher;
  return payload;
};

const syncTeacherSubjectAssignment = async (subjectDoc, nextTeacherId, previousTeacherId = null) => {
  const subjectId = subjectDoc?._id?.toString();
  const classId = subjectDoc?.class?.toString();

  if (!subjectId || !classId) return;

  if (previousTeacherId && previousTeacherId !== nextTeacherId) {
    await Teacher.findByIdAndUpdate(previousTeacherId, {
      $pull: { assignedSubjects: subjectId }
    });
    await syncTeacherClassAccess(previousTeacherId);
  }

  if (nextTeacherId) {
    await Teacher.findByIdAndUpdate(nextTeacherId, {
      $addToSet: { assignedSubjects: subjectId, assignedClasses: classId }
    });
    await syncTeacherClassAccess(nextTeacherId);
  }
};

exports.getAll = async (req, res) => {
  const { classId, academicYear } = req.query;
  const q = {};

  if (req.user.role === "teacher") {
    const { assignedClassIds, assignedSubjectIds } = await getTeacherAccessState(req.user.id);
    if (classId) {
      if (!(await canAccessClass(req, classId))) {
        return res.status(403).json({ message: "Class not assigned to teacher" });
      }
      q.class = classId;
    } else if (assignedClassIds.length > 0) {
      q.class = { $in: assignedClassIds };
    } else if (assignedSubjectIds.length > 0) {
      q._id = { $in: assignedSubjectIds };
    } else {
      q._id = { $in: [] };
    }
  } else {
    if (classId) q.class = classId;
  }

  if (academicYear) q.academicYear = academicYear;
  res.json(await populateSubject(Subject.find(q)));
};

exports.create = async (req, res) => {
  try {
    const payload = normalizeSubjectPayload(req.body);
    const subject = await Subject.create(payload);
    await syncTeacherSubjectAssignment(subject, payload.teacher);
    res.status(201).json(await populateSubject(Subject.findById(subject._id)));
  }
  catch (e) { res.status(400).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const payload = normalizeSubjectPayload(req.body);
    const previousSubject = await Subject.findById(req.params.id).select("_id class teacher").lean();
    if (!previousSubject) return res.status(404).json({ message: "Subject not found" });
    const update = { $set: payload };

    if (Object.prototype.hasOwnProperty.call(req.body, "teacher") && !req.body.teacher) {
      update.$unset = { teacher: "" };
    }

    const subject = await Subject.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    await syncTeacherSubjectAssignment(subject, payload.teacher || null, previousSubject.teacher || null);

    if (String(previousSubject.class) !== String(subject.class)) {
      await Class.updateMany(
        { classTeacherSubject: subject._id, _id: previousSubject.class },
        { $unset: { classTeacherSubject: "" } }
      );
    }

    res.json(await populateSubject(Subject.findById(subject._id)));
  }
  catch (e) { res.status(400).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).select("_id class teacher").lean();
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    await Class.updateMany(
      { classTeacherSubject: subject._id },
      { $unset: { classTeacherSubject: "" } }
    );

    await Subject.findByIdAndDelete(req.params.id);
    await Teacher.updateMany(
      { assignedSubjects: subject._id },
      { $pull: { assignedSubjects: subject._id } }
    );
    if (subject.teacher) {
      await syncTeacherClassAccess(subject.teacher);
    }
    res.json({ message: "Deleted" });
  }
  catch (e) { res.status(500).json({ message: e.message }); }
};
