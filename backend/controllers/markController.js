const Mark = require("../models/Mark");
const Student = require("../models/Student");
const Exam = require("../models/Exam");
const Teacher = require("../models/Teacher");

const calculateGrade = (marksObtained, maxMarks, isAbsent) => {
  if (isAbsent) return "AB";
  const percentage = maxMarks > 0 ? (Number(marksObtained || 0) / maxMarks) * 100 : 0;
  if      (percentage >= 90) return "A+";
  else if (percentage >= 80) return "A";
  else if (percentage >= 70) return "B+";
  else if (percentage >= 60) return "B";
  else if (percentage >= 50) return "C";
  else if (percentage >= 35) return "D";
  return "F";
};

exports.getExamMarks = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (req.user.role === "teacher") {
      const teacher = await Teacher.findById(req.user.id).select("assignedClasses assignedSubjects");
      const assignedClassIds = teacher?.assignedClasses?.map(id => id.toString()) || [];
      const assignedSubjectIds = teacher?.assignedSubjects?.map(id => id.toString()) || [];
      const classAllowed = assignedClassIds.includes(exam.class.toString());
      const subjectAllowed = !assignedSubjectIds.length || assignedSubjectIds.includes(exam.subject.toString());

      if (!classAllowed || !subjectAllowed) {
        return res.status(403).json({ message: "Exam not assigned to teacher" });
      }
    }

    const students = await Student.find({ class: exam.class, isActive: true })
      .select("name satCode")
      .sort({ name: 1 })
      .lean();
    const existingMarks = await Mark.find({ exam: exam._id })
      .select("student marksObtained isAbsent grade")
      .lean();
    const marksByStudent = new Map(existingMarks.map(mark => [mark.student.toString(), mark]));

    const result = students.map(s => {
      const m = marksByStudent.get(s._id.toString());
      return {
        studentId:     s._id,
        name:          s.name,
        satCode:       s.satCode,
        marksObtained: m ? m.marksObtained : "",
        isAbsent:      m ? m.isAbsent : false,
        grade:         m ? m.grade : ""
      };
    });

    res.json(result);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.saveMarks = async (req, res) => {
  try {
    const { examId, records } = req.body;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (req.user.role === "teacher") {
      const teacher = await Teacher.findById(req.user.id).select("assignedClasses assignedSubjects");
      const assignedClassIds = teacher?.assignedClasses?.map(id => id.toString()) || [];
      const assignedSubjectIds = teacher?.assignedSubjects?.map(id => id.toString()) || [];
      const classAllowed = assignedClassIds.includes(exam.class.toString());
      const subjectAllowed = !assignedSubjectIds.length || assignedSubjectIds.includes(exam.subject.toString());

      if (!classAllowed || !subjectAllowed) {
        return res.status(403).json({ message: "Exam not assigned to teacher" });
      }
    }

    const bulkOps = records.map(r => ({
      updateOne: {
        filter: { student: r.studentId, exam: examId, subject: exam.subject },
        update: {
          student:       r.studentId,
          exam:          examId,
          subject:       exam.subject,
          academicYear:  exam.academicYear,
          marksObtained: r.marksObtained || 0,
          isAbsent:      r.isAbsent || false,
          grade:         calculateGrade(r.marksObtained, exam.maxMarks, r.isAbsent),
          enteredBy:     req.user.id
        },
        upsert: true
      }
    }));

    if (bulkOps.length) await Mark.bulkWrite(bulkOps);
    res.json({ message: "Marks saved successfully" });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.getReportCard = async (req, res) => {
  try {
    const { studentId, academicYear, examType } = req.query;
    const query = { student: studentId };
    if (academicYear) query.academicYear = academicYear;

    const marks = await Mark.find(query).populate("exam").populate("subject", "name");
    const filteredMarks = examType ? marks.filter(m => m.exam?.examType === examType) : marks;

    const subjects = filteredMarks.reduce((acc, m) => {
      const sName = m.subject?.name || "Subject";
      if (!acc[sName]) acc[sName] = [];
      acc[sName].push({
        examTitle:     m.exam?.title || "Exam",
        examType:      m.exam?.examType || "Exam",
        marksObtained: m.marksObtained,
        maxMarks:      m.exam?.maxMarks || 0,
        grade:         m.grade,
        percentage:    m.exam?.maxMarks ? (m.marksObtained / m.exam.maxMarks) * 100 : 0
      });
      return acc;
    }, {});

    res.json({ subjects });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
