const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getAll } = require("../controllers/studentLoginLogController");

router.get("/", auth, roles("admin"), getAll);

module.exports = router;
