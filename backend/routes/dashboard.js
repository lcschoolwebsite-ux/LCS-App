const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getAdminStats } = require("../controllers/dashboardController");

router.get("/admin-stats", auth, roles("admin"), getAdminStats);

module.exports = router;
