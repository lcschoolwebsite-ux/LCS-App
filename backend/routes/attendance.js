const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getOrInit, getMarkedDates, markAttendance, getStudentReport, getHolidaySummary } = require("../controllers/attendanceController");

router.get("/dates", auth, roles("admin", "teacher"), getMarkedDates);
router.get("/holiday-summary", auth, roles("admin", "teacher"), getHolidaySummary);
router.get("/", auth, roles("admin", "teacher"), getOrInit);
router.post("/", auth, roles("teacher"), markAttendance);
router.get("/student-report", auth, getStudentReport);

module.exports = router;
