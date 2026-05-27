const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getAll, create, remove } = require("../controllers/feeTypeController");

router.get("/", auth, roles("admin"), getAll);
router.post("/", auth, roles("admin"), create);
router.delete("/:id", auth, roles("admin"), remove);

module.exports = router;
