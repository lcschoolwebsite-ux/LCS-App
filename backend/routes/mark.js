const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getExamMarks, saveMarks, getReportCard } = require("../controllers/markController");

router.get("/exam/:examId", auth, getExamMarks);
router.post("/save", auth, roles("teacher"), saveMarks);
router.get("/report-card", auth, getReportCard);

module.exports = router;
