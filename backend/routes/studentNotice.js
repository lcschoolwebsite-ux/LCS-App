const router = require("express").Router();
const controller = require("../controllers/studentNoticeController");
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/roles");

// Search students by name, SAT code, or mobile
router.get("/search", protect, restrictTo("admin"), controller.searchStudents);

// Get all classes
router.get("/classes", protect, restrictTo("admin"), controller.getClasses);

// Send notice to individual students
router.post("/send-to-students", protect, restrictTo("admin"), controller.sendToStudents);

// Send notice to entire class
router.post("/send-to-class", protect, restrictTo("admin"), controller.sendToClass);

module.exports = router;
