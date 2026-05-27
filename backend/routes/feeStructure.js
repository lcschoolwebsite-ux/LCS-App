const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getAll, getById, createOrUpdate, remove } = require("../controllers/feeStructureController");

router.get("/", auth, roles("admin"), getAll);
router.get("/:id", auth, roles("admin"), getById);
router.post("/", auth, roles("admin"), createOrUpdate);
router.delete("/:id", auth, roles("admin"), remove);

module.exports = router;
