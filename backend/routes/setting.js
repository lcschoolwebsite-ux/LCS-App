const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const {
  getStudentRegistrationSettings,
  updateStudentRegistrationSettings
} = require("../controllers/settingController");

router.get("/student-registration", auth, getStudentRegistrationSettings);
router.put("/student-registration", auth, roles("admin"), updateStudentRegistrationSettings);

module.exports = router;
