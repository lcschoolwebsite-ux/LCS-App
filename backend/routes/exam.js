const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getAll, create, update, remove, getStats } = require("../controllers/examController");

router.get("/", auth, getAll);
router.post("/", auth, create);
router.put("/:id", auth, roles("admin"), update);
router.delete("/:id", auth, roles("admin"), remove);
router.get("/:id/stats", auth, getStats);

module.exports = router;
