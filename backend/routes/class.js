const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getAll, getManagement, create, update, remove } = require("../controllers/classController");

router.get("/", auth, getAll);
router.get("/:id/management", auth, roles("admin"), getManagement);
router.post("/", auth, roles("admin"), create);
router.put("/:id", auth, roles("admin"), update);
router.delete("/:id", auth, roles("admin"), remove);

module.exports = router;
