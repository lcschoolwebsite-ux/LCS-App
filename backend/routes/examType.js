const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getAll, create, updateLaunch } = require("../controllers/examTypeController");

router.get("/", auth, getAll);
router.post("/", auth, roles("admin"), create);
router.put("/:id/launch", auth, roles("admin"), updateLaunch);

module.exports = router;
