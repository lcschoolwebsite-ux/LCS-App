const router = require("express").Router();
const controller = require("../controllers/studentNoticeController");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

// Search students by name, SAT code, or mobile
router.get("/search", auth, roles("admin"), controller.searchStudents);

// Get all classes
router.get("/classes", auth, roles("admin"), controller.getClasses);

// Send notice to individual students
router.post("/send-to-students", auth, roles("admin"), controller.sendToStudents);

// Send notice to entire class
router.post("/send-to-class", auth, roles("admin"), controller.sendToClass);

module.exports = router;
