const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getExamMarks, saveMarks, getReportCard, getAdminOverview } = require("../controllers/markController");

router.get("/exam/:examId", auth, getExamMarks);
router.post("/save", auth, roles("teacher"), saveMarks);
router.get("/report-card", auth, getReportCard);
router.get("/admin/overview", auth, roles("admin"), getAdminOverview);

module.exports = router;
