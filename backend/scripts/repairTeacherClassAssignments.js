require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");

const toId = value => value?.toString();

async function repairTeacherClassAssignments() {
  const [teachers, classes] = await Promise.all([
    Teacher.find({}).select("_id assignedClasses").lean(),
    Class.find({}).select("_id classTeacher").lean()
  ]);

  const classById = new Map(classes.map(cls => [toId(cls._id), cls]));
  const teacherById = new Map(teachers.map(teacher => [toId(teacher._id), teacher]));
  const teacherAssignments = new Map();
  const classCandidates = new Map();
  const warnings = [];

  for (const teacher of teachers) {
    const teacherId = toId(teacher._id);
    const classIds = (teacher.assignedClasses || [])
      .map(toId)
      .filter(classId => classById.has(classId));

    teacherAssignments.set(teacherId, new Set());

    for (const classId of classIds) {
      if (!classCandidates.has(classId)) {
        classCandidates.set(classId, []);
      }
      classCandidates.get(classId).push(teacherId);
    }
  }

  for (const cls of classes) {
    const classId = toId(cls._id);
    const currentTeacherId = toId(cls.classTeacher);
    const teacherCandidates = classCandidates.get(classId) || [];
    let resolvedTeacherId = null;

    if (currentTeacherId && teacherById.has(currentTeacherId)) {
      resolvedTeacherId = currentTeacherId;
      if (
        teacherCandidates.length > 0 &&
        teacherCandidates.some(candidateId => candidateId !== currentTeacherId)
      ) {
        warnings.push(
          `Class ${classId} had conflicting teacher refs; kept classTeacher=${currentTeacherId}`
        );
      }
    } else if (teacherCandidates.length > 0) {
      resolvedTeacherId = teacherCandidates[0];
      if (teacherCandidates.length > 1) {
        warnings.push(
          `Class ${classId} was referenced by multiple teachers; assigned to ${resolvedTeacherId}`
        );
      }
    }

    if (resolvedTeacherId) {
      teacherAssignments.get(resolvedTeacherId)?.add(classId);
    }
  }

  const classBulkOps = [];
  for (const cls of classes) {
    const classId = toId(cls._id);
    const currentTeacherId = toId(cls.classTeacher);
    const teacherCandidates = classCandidates.get(classId) || [];
    let resolvedTeacherId = null;

    if (currentTeacherId && teacherById.has(currentTeacherId)) {
      resolvedTeacherId = currentTeacherId;
    } else if (teacherCandidates.length > 0) {
      resolvedTeacherId = teacherCandidates[0];
    }

    classBulkOps.push({
      updateOne: {
        filter: { _id: cls._id },
        update: resolvedTeacherId
          ? { $set: { classTeacher: new mongoose.Types.ObjectId(resolvedTeacherId) } }
          : { $unset: { classTeacher: "" } }
      }
    });
  }

  const teacherBulkOps = teachers.map(teacher => {
    const teacherId = toId(teacher._id);
    const classIds = [...(teacherAssignments.get(teacherId) || new Set())];
    return {
      updateOne: {
        filter: { _id: teacher._id },
        update: { $set: { assignedClasses: classIds.map(id => new mongoose.Types.ObjectId(id)) } }
      }
    };
  });

  if (classBulkOps.length > 0) {
    await Class.bulkWrite(classBulkOps, { ordered: false });
  }

  if (teacherBulkOps.length > 0) {
    await Teacher.bulkWrite(teacherBulkOps, { ordered: false });
  }

  return {
    teachers: teachers.length,
    classes: classes.length,
    warnings
  };
}

async function main() {
  const connected = await connectDB();
  if (!connected) {
    throw new Error("MongoDB connection failed");
  }

  try {
    const result = await repairTeacherClassAssignments();
    console.log(`Repaired ${result.classes} classes and ${result.teachers} teachers.`);
    if (result.warnings.length > 0) {
      console.log("Warnings:");
      for (const warning of result.warnings) {
        console.log(`- ${warning}`);
      }
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error("Repair failed:", err.message);
  process.exitCode = 1;
});
