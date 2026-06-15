const Teacher = require("../models/Teacher");
const Class = require("../models/Class");

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

const syncTeacherAssignments = async (teacherId, classIds) => {
  const validClassIds = await filterExistingClassIds(classIds);

  await Teacher.findByIdAndUpdate(teacherId, {
    $set: { assignedClasses: validClassIds }
  });

  if (validClassIds.length > 0) {
    await Teacher.updateMany(
      { _id: { $ne: teacherId }, assignedClasses: { $in: validClassIds } },
      { $pull: { assignedClasses: { $in: validClassIds } } }
    );
  }

  await Class.updateMany(
    { _id: { $in: validClassIds } },
    { $set: { classTeacher: teacherId } }
  );

  await Class.updateMany(
    { classTeacher: teacherId, _id: { $nin: validClassIds } },
    { $unset: { classTeacher: "" } }
  );

  return validClassIds;
};

const syncClassTeacher = async (classId, nextTeacherId, previousTeacherId = null) => {
  const normalizedClassId = classId?.toString();
  const normalizedNextTeacherId = nextTeacherId ? nextTeacherId.toString() : null;
  const normalizedPreviousTeacherId = previousTeacherId ? previousTeacherId.toString() : null;

  if (!normalizedClassId) return;

  if (normalizedPreviousTeacherId && normalizedPreviousTeacherId !== normalizedNextTeacherId) {
    await Teacher.findByIdAndUpdate(normalizedPreviousTeacherId, {
      $pull: { assignedClasses: normalizedClassId }
    });
  }

  if (normalizedNextTeacherId) {
    await Teacher.findByIdAndUpdate(normalizedNextTeacherId, {
      $addToSet: { assignedClasses: normalizedClassId }
    });

    await Teacher.updateMany(
      {
        _id: { $ne: normalizedNextTeacherId },
        assignedClasses: normalizedClassId
      },
      { $pull: { assignedClasses: normalizedClassId } }
    );

    await Class.findByIdAndUpdate(normalizedClassId, {
      $set: { classTeacher: normalizedNextTeacherId }
    });
    return;
  }

  await Teacher.updateMany(
    { assignedClasses: normalizedClassId },
    { $pull: { assignedClasses: normalizedClassId } }
  );

  await Class.findByIdAndUpdate(normalizedClassId, {
    $unset: { classTeacher: "" }
  });
};

module.exports = {
  normalizeIdList,
  filterExistingClassIds,
  syncTeacherAssignments,
  syncClassTeacher
};
