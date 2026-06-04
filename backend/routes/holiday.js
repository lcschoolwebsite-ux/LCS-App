const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getHolidays, createHoliday, updateHoliday, deleteHoliday } = require("../controllers/holidayController");

router.get("/", auth, roles("admin"), getHolidays);
router.post("/", auth, roles("admin"), createHoliday);
router.patch("/:id", auth, roles("admin"), updateHoliday);
router.delete("/:id", auth, roles("admin"), deleteHoliday);

module.exports = router;
