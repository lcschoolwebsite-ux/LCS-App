const router = require("express").Router();
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { getOverview, getFeeTrend } = require("../controllers/analyticsController");

router.get("/overview", auth, roles("admin"), getOverview);
router.get("/fee-trend", auth, roles("admin"), getFeeTrend);

module.exports = router;
