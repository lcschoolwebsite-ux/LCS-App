const router = require("express").Router();
const auth = require("../middleware/auth");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Exam = require("../models/Exam");
const Announcement = require("../models/Announcement");

router.get("/", auth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({});

  const regex = new RegExp(q, "i");

  try {
    const [students, teachers, exams, announcements] = await Promise.all([
      Student.find({ name: regex }).limit(5).select("name satCode"),
      Teacher.find({ name: regex }).limit(5).select("name username"),
      Exam.find({ title: regex }).limit(5).select("title"),
      Announcement.find({ title: regex }).limit(5).select("title")
    ]);

    res.json({ students, teachers, exams, announcements });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
