const Student = require("../models/Student");
const Class = require("../models/Class");
const { notifyStudentById, notifyClassStudents } = require("../utils/pushNotification");

/**
 * Search students by name, SAT code, or mobile number
 */
exports.searchStudents = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const searchRegex = new RegExp(query.trim(), "i");
    
    const students = await Student.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { satCode: searchRegex },
        { mobile: searchRegex }
      ]
    })
      .select("name satCode mobile class")
      .populate("class", "name section")
      .limit(50)
      .lean();

    const formatted = students.map(s => ({
      _id: s._id,
      name: s.name,
      satCode: s.satCode,
      mobile: s.mobile,
      className: s.class ? `${s.class.name} ${s.class.section || ""}`.trim() : "N/A"
    }));

    res.json(formatted);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * Get all classes for dropdown
 */
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .select("name section")
      .sort({ name: 1, section: 1 })
      .lean();

    const formatted = classes.map(c => ({
      _id: c._id,
      name: `${c.name} ${c.section || ""}`.trim()
    }));

    res.json(formatted);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * Send notice to individual students
 */
exports.sendToStudents = async (req, res) => {
  try {
    const { studentIds, title, message } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "At least one student must be selected" });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Message is required" });
    }

    const results = {
      total: studentIds.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    for (const studentId of studentIds) {
      try {
        await notifyStudentById(
          studentId,
          title.trim(),
          message.trim(),
          { 
            url: "/student",
            type: "notice",
            sentBy: req.user.name || "Admin"
          }
        );
        results.sent += 1;
      } catch (err) {
        results.failed += 1;
        results.errors.push({
          studentId,
          error: err.message
        });
        console.warn(`Failed to notify student ${studentId}:`, err.message);
      }
    }

    res.json({
      message: `Notice sent to ${results.sent} out of ${results.total} students`,
      results
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * Send notice to entire class
 */
exports.sendToClass = async (req, res) => {
  try {
    const { classId, title, message } = req.body;

    if (!classId) {
      return res.status(400).json({ message: "Class is required" });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Get student count for the class
    const studentCount = await Student.countDocuments({
      class: classId,
      isActive: true
    });

    if (studentCount === 0) {
      return res.status(404).json({ message: "No active students found in this class" });
    }

    try {
      await notifyClassStudents(
        classId,
        title.trim(),
        message.trim(),
        { 
          url: "/student",
          type: "notice",
          sentBy: req.user.name || "Admin"
        }
      );

      res.json({
        message: `Notice sent to class (${studentCount} students)`,
        studentCount
      });
    } catch (err) {
      console.error("Failed to send class notice:", err);
      res.status(500).json({ message: "Failed to send notice to class" });
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
