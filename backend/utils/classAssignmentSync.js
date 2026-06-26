const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Subject = require("../models/Subject");

const normalizeIdList = value => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return [...new Set(list.filter(Boolean).map(id => id.toString()))];
};

const filterExistingClassIds = async classIds => {
  const normalizedIds = normalizeIdList(classIds);
  if (normalizedIds.length === 0) {
    return [];
  }

  const classes = await Class.find({ _id: { $in: normalizedIds } }).select("_id").lean();
  return classes.map(cls => cls._id.toString());
};

const syncTeacherClassAccess = async (teacherId) => {
  if (!teacherId) return [];

  const [classTeacherClasses, subjectClasses] = await Promise.all([
    Class.find({ classTeacher: teacherId }).select("_id").lean(),
    Subject.find({ teacher: teacherId }).select("class").lean()
  ]);

  const classIds = [
    ...new Set([
      ...classTeacherClasses.map(cls => cls._id.toString()),
      ...subjectClasses.map(subject => subject.class?.toString()).filter(Boolean)
    ])
  ];

  await Teacher.findByIdAndUpdate(teacherId, {
    $set: { assignedClasses: classIds }
  });

  return classIds;
};

const syncTeacherAssignments = async (teacherId, classIds) => {
  const validClassIds = await filterExistingClassIds(classIds);
  const previousClasses = await Class.find({ _id: { $in: validClassIds } })
    .select("_id classTeacher")
    .lean();
  const previousTeacherIds = [
    ...new Set(
      previousClasses
        .map(cls => cls.classTeacher?.toString())
        .filter(Boolean)
    )
  ];

  await Class.updateMany(
    { _id: { $in: validClassIds } },
    { $set: { classTeacher: teacherId } }
  );

  await Class.updateMany(
    { classTeacher: teacherId, _id: { $nin: validClassIds } },
    { $unset: { classTeacher: "" } }
  );

  await Promise.all([
    syncTeacherClassAccess(teacherId),
    ...previousTeacherIds.filter(id => id !== teacherId?.toString()).map(id => syncTeacherClassAccess(id))
  ]);

  return validClassIds;
};

const syncClassTeacher = async (classId, nextTeacherId, previousTeacherId = null) => {
  const normalizedClassId = classId?.toString();
  const normalizedNextTeacherId = nextTeacherId ? nextTeacherId.toString() : null;
  const normalizedPreviousTeacherId = previousTeacherId ? previousTeacherId.toString() : null;

  if (!normalizedClassId) return;

  if (normalizedNextTeacherId) {
    await Class.findByIdAndUpdate(normalizedClassId, {
      $set: { classTeacher: normalizedNextTeacherId }
    });
    await Promise.all([
      syncTeacherClassAccess(normalizedNextTeacherId),
      normalizedPreviousTeacherId && normalizedPreviousTeacherId !== normalizedNextTeacherId
        ? syncTeacherClassAccess(normalizedPreviousTeacherId)
        : Promise.resolve()
    ]);
    return;
  }

  await Class.findByIdAndUpdate(normalizedClassId, {
    $unset: { classTeacher: "" }
  });

  await syncTeacherClassAccess(normalizedPreviousTeacherId);
};

module.exports = {
  normalizeIdList,
  filterExistingClassIds,
  syncTeacherClassAccess,
  syncTeacherAssignments,
  syncClassTeacher
};
