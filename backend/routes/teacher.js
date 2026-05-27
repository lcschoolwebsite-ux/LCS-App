const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getAll, create, update, remove, assignClass, setClasses, assignSubject, resetPassword } = require("../controllers/teacherController");

router.get("/", auth, roles("admin"), getAll);
router.post("/", auth, roles("admin"), create);
router.put("/:id", auth, roles("admin"), update);
router.delete("/:id", auth, roles("admin"), remove);
router.post("/assign-class/:id", auth, roles("admin"), assignClass);
router.put("/:id/classes", auth, roles("admin"), setClasses);
router.post("/assign-subject/:id", auth, roles("admin"), assignSubject);
router.post("/reset-password/:id", auth, roles("admin"), resetPassword);

module.exports = router;
