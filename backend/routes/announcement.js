const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getAll, create, togglePin, remove } = require("../controllers/announcementController");

router.get("/", auth, getAll);
router.post("/", auth, roles("admin"), create);
router.patch("/:id/pin", auth, roles("admin"), togglePin);
router.delete("/:id", auth, roles("admin"), remove);

module.exports = router;
