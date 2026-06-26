const Class = require("../models/Class");
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");

const toIdString = value => (value == null ? "" : value.toString());

const getTeacherAccessState = async (teacherId) => {
  const teacher = await Teacher.findById(teacherId)
    .select("assignedClasses assignedSubjects isActive")
    .lean();

  if (!teacher) {
    return {
      teacher: null,
      assignedClassIds: [],
      assignedSubjectIds: []
    };
  }

  return {
    teacher,
    assignedClassIds: (teacher.assignedClasses || []).map(toIdString),
    assignedSubjectIds: (teacher.assignedSubjects || []).map(toIdString)
  };
};

const isAdmin = req => String(req.user?.role || "").toLowerCase() === "admin";
const isTeacher = req => String(req.user?.role || "").toLowerCase() === "teacher";

const getClassDoc = async (classId) =>
  Class.findById(classId).select("_id classTeacher").lean();

const getSubjectDoc = async (subjectId) =>
  Subject.findById(subjectId).select("_id class teacher name academicYear").lean();

const canAccessClass = async (req, classId) => {
  if (isAdmin(req)) return true;
  if (!isTeacher(req)) return false;

  const { assignedClassIds } = await getTeacherAccessState(req.user.id);
  return assignedClassIds.includes(toIdString(classId));
};

const canManageClassTeacher = async (req, classId) => {
  if (isAdmin(req)) return true;
  return canAccessClass(req, classId);
};

const canViewSubject = async (req, subjectId) => {
  if (isAdmin(req)) return true;
  if (!isTeacher(req)) return false;

  const subject = await getSubjectDoc(subjectId);
  if (!subject) return false;

  return canAccessClass(req, subject.class);
};

const canEditSubject = async (req, subjectId) => {
  if (isAdmin(req)) return true;
  if (!isTeacher(req)) return false;

  const subject = await getSubjectDoc(subjectId);
  if (!subject) return false;

  const classDoc = await getClassDoc(subject.class);
  const { assignedClassIds, assignedSubjectIds } = await getTeacherAccessState(req.user.id);
  const classAccess = assignedClassIds.includes(toIdString(subject.class));
  const classTeacherAccess = toIdString(classDoc?.classTeacher) === toIdString(req.user.id);
  const subjectAccess = assignedSubjectIds.includes(toIdString(subject._id));

  return classAccess && (classTeacherAccess || subjectAccess);
};

const canEditExam = async (req, exam) => {
  if (isAdmin(req)) return true;
  if (!isTeacher(req) || !exam) return false;

  const { assignedClassIds, assignedSubjectIds } = await getTeacherAccessState(req.user.id);
  const classDoc = await getClassDoc(exam.class);
  const classId = toIdString(exam.class);
  const classAccess = assignedClassIds.includes(classId);
  const classTeacherAccess = toIdString(classDoc?.classTeacher) === toIdString(req.user.id);
  const subjectAccess = assignedSubjectIds.length === 0 || assignedSubjectIds.includes(toIdString(exam.subject));

  return classAccess && (classTeacherAccess || subjectAccess);
};

const canTakeAttendance = async (req, classId) => {
  if (isAdmin(req)) return true;
  if (!isTeacher(req)) return false;

  const classDoc = await getClassDoc(classId);
  return toIdString(classDoc?.classTeacher) === toIdString(req.user.id);
};

const canViewExam = async (req, exam) => {
  if (isAdmin(req)) return true;
  if (!isTeacher(req) || !exam) return false;

  const { assignedClassIds } = await getTeacherAccessState(req.user.id);
  return assignedClassIds.includes(toIdString(exam.class));
};

module.exports = {
  getTeacherAccessState,
  canAccessClass,
  canManageClassTeacher,
  canViewSubject,
  canEditSubject,
  canViewExam,
  canEditExam,
  canTakeAttendance
};
