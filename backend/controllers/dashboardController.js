const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const StudentFee = require("../models/StudentFee");
const Attendance = require("../models/Attendance");
const AcademicYear = require("../models/AcademicYear");
const { getHolidayCalendar, toLocalDateString } = require("../utils/holidayUtils");

exports.getAdminStats = async (req, res) => {
  try {
    const activeYear = await AcademicYear.findOne({ isActive: true });
    const yearId = activeYear ? activeYear._id : null;

    // 1. Basic Counts
    const [studentCount, teacherCount, classCount] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Teacher.countDocuments({ isActive: true }),
      Class.countDocuments({})
    ]);

    // 2. Fee Stats
    const feeStats = await StudentFee.aggregate([
      { $match: yearId ? { academicYear: yearId } : {} },
      { 
        $group: {
          _id: null,
          totalCollected: { $sum: "$totalPaid" },
          totalDue: { $sum: "$totalDue" },
          totalExpected: { $sum: "$totalAnnualFee" }
        }
      }
    ]);

    const fees = feeStats[0] || { totalCollected: 0, totalDue: 0, totalExpected: 0 };

    // 3. Students by Class
    const studentsByClass = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$class", count: { $sum: 1 } } },
      { $lookup: { from: "classes", localField: "_id", foreignField: "_id", as: "classInfo" } },
      { $unwind: "$classInfo" },
      { $project: { name: { $concat: ["$classInfo.name", "$classInfo.section"] }, count: 1 } }
    ]);

    // 4. Today's Attendance
    const today = toLocalDateString(new Date());
    const { holidays } = await getHolidayCalendar(yearId);
    const todayHoliday = holidays.find(h => h.date === today);

    if (todayHoliday) {
      return res.json({
        students: studentCount,
        teachers: teacherCount,
        classes: classCount,
        fees: fees.totalCollected,
        pendingFees: fees.totalDue,
        studentsByClass,
        todayAttendance: {
          present: 0,
          absent: 0,
          unmarkedClasses: [],
          isHoliday: true,
          holiday: todayHoliday.eventName,
          holidayDate: todayHoliday.date
        },
        recentActivity: [],
        upcomingExams: []
      });
    }

    const attendanceRecords = await Attendance.find({ date: today })
      .select("class absentees")
      .populate("class", "name section")
      .lean();
    
    // We need total students to calculate present count
    const totalStudentsInMarkedClasses = await Student.countDocuments({ 
      class: { $in: attendanceRecords.map(a => a.class?._id).filter(Boolean) },
      isActive: true
    });
    
    const totalAbsentees = attendanceRecords.reduce((sum, rec) => sum + rec.absentees.length, 0);

    const todayAttendance = {
      present: totalStudentsInMarkedClasses - totalAbsentees,
      absent: totalAbsentees,
      unmarkedClasses: [],
      isHoliday: false
    };

    // Find unmarked classes
    const allClasses = await Class.find({}).select("name section").lean();
    const markedClassIds = attendanceRecords.map(a => a.class?._id.toString()).filter(Boolean);
    todayAttendance.unmarkedClasses = allClasses
      .filter(c => !markedClassIds.includes(c._id.toString()))
      .map(c => `${c.name}${c.section}`);

    res.json({
      students: studentCount,
      teachers: teacherCount,
      classes: classCount,
      fees: fees.totalCollected,
      pendingFees: fees.totalDue,
      studentsByClass,
      todayAttendance,
      recentActivity: [], // Optional: Could fetch recent logs
      upcomingExams: []    // Optional: Could fetch from Exam model
    });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
