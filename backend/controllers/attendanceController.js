const Attendance = require("../models/Attendance");
const Student    = require("../models/Student");
const AcademicYear = require("../models/AcademicYear");
const Teacher = require("../models/Teacher");
const { getIO } = require("../utils/socket");

const ensureAssignedClass = async (req, classId) => {
  if (req.user.role !== "teacher") return true;
  const teacher = await Teacher.findById(req.user.id).select("assignedClasses");
  const assignedClassIds = teacher?.assignedClasses?.map(id => id.toString()) || [];
  return assignedClassIds.includes(classId);
};

exports.getOrInit = async (req, res) => {
  try {
    const { classId, date } = req.query;
    if (!classId || !date) return res.status(400).json({ message: "Class and Date required" });
    if (!(await ensureAssignedClass(req, classId))) return res.status(403).json({ message: "Class not assigned to teacher" });

    const students = await Student.find({ class: classId, isActive: true })
      .select("name satCode")
      .sort({ name: 1 })
      .lean();
    let record = await Attendance.findOne({ class: classId, date }).select("absentees").lean();

    const absentIds = new Set(record ? record.absentees.map(a => a.toString()) : []);
    const result = students.map(s => ({
      _id:     s._id,
      name:    s.name,
      satCode: s.satCode,
      absent:  absentIds.has(s._id.toString())
    }));

    res.json({ students: result, alreadyMarked: !!record });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMarkedDates = async (req, res) => {
  try {
    const { classId } = req.query;
    if (!classId) return res.status(400).json({ message: "Class required" });
    if (!(await ensureAssignedClass(req, classId))) return res.status(403).json({ message: "Class not assigned to teacher" });

    const dates = await Attendance.find({ class: classId })
      .select("date absentees markedAt updatedAt")
      .sort({ date: -1 })
      .lean();

    res.json(dates.map(record => ({
      date: record.date,
      absentCount: record.absentees?.length || 0,
      markedAt: record.markedAt,
      updatedAt: record.updatedAt
    })));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.markAttendance = async (req, res) => {
  try {
    const { classId, date, absentIds } = req.body;
    const activeYear = await AcademicYear.findOne({ isActive: true });
    
    if (!activeYear) return res.status(400).json({ message: "No active academic year found" });
    if (!(await ensureAssignedClass(req, classId))) return res.status(403).json({ message: "Class not assigned to teacher" });

    const attendance = await Attendance.findOneAndUpdate(
      { class: classId, date },
      { 
        class: classId, 
        date, 
        absentees: absentIds, 
        markedBy: req.user.id,
        academicYear: activeYear._id 
      },
      { upsert: true, new: true }
    );

    // Notify Admin via Socket.io
    try {
      const io = getIO();
      if (io) {
        io.to("admin").emit("attendance-marked", { 
          classId, 
          date, 
          absentCount: absentIds.length,
          teacher: req.user.name 
        });
      }
    } catch (err) {
      console.warn("Socket notification failed:", err.message);
    }

    res.json({ message: "Attendance marked", attendance });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.getStudentReport = async (req, res) => {
  try {
    const { studentId, month, year } = req.query;
    const start = `${year}-${String(month).padStart(2,"0")}-01`;
    const end   = `${year}-${String(month).padStart(2,"0")}-31`;

    const student = await Student.findById(studentId).select("class").lean();
    if (!student) return res.status(404).json({ message: "Student not found" });

    const records = await Attendance.find({ class: student.class, date: { $gte: start, $lte: end } })
      .select("date absentees")
      .lean();

    let present = 0, absent = 0;
    const log = records.map(r => {
      const isAbsent = r.absentees.map(a => a.toString()).includes(studentId);
      isAbsent ? absent++ : present++;
      return { date: r.date, status: isAbsent ? "Absent" : "Present" };
    });

    res.json({ log, present, absent, total: records.length });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
