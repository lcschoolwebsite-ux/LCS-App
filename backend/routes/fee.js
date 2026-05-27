const router = require("express").Router();
const auth   = require("../middleware/auth");
const roles  = require("../middleware/roles");
const { getStudentFee, createOrder, verifyPayment, getAllFees, recordManualPayment, getStats } = require("../controllers/feeController");

router.use(auth);
router.get("/",                     roles("admin"), getAllFees);
router.get("/stats",                roles("admin"), getStats);
router.get("/:studentId",           getStudentFee);
router.post("/create-order",        roles("student"), createOrder);
router.post("/verify",              roles("student"), verifyPayment);
router.post("/admin/record",        roles("admin"), recordManualPayment);

module.exports = router;
