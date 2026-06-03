const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getAll, getActive, create, update, setActive, remove } = require("../controllers/academicYearController");

router.get("/", auth, getAll);
router.get("/active", auth, getActive);
router.post("/", auth, roles("admin"), create);
router.patch("/:id", auth, roles("admin"), update);
router.patch("/active/:id", auth, roles("admin"), setActive);
router.delete("/:id", auth, roles("admin"), remove);

module.exports = router;
