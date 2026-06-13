const Razorpay = require("razorpay");
const crypto   = require("crypto");
const Fee      = require("../models/Fee");
const { notifyStudentById } = require("../utils/pushNotification");

const hasRazorpayCredentials = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getRazorpayClient = () => {
  if (!hasRazorpayCredentials()) {
    throw new Error("Online fee payment is not configured on the server");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

exports.getStudentFee = async (req, res) => {
  try {
    const fee = await Fee.findOne({ student: req.params.studentId }).populate("student","name satCode");
    res.json(fee);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createOrder = async (req, res) => {
  try {
    const { amount, studentId } = req.body;
    const order = await getRazorpayClient().orders.create({
      amount:   amount * 100,
      currency: "INR",
      receipt:  `rcpt_${Date.now()}`,
      notes:    { studentId }
    });
    res.json({ ...order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, studentId, amount } = req.body;

    const body      = razorpay_order_id + "|" + razorpay_payment_id;
    if (!hasRazorpayCredentials()) {
      return res.status(500).json({ message: "Online fee payment is not configured on the server" });
    }

    const expected  = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                            .update(body).digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json({ message: "Payment verification failed" });

    const fee = await Fee.findOne({ student: studentId });
    fee.paidAmount += Number(amount);
    fee.payments.push({
      amount,
      date:              new Date().toISOString().split("T")[0],
      method:            "Online",
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      receiptNumber:     "RCP" + Date.now(),
      status:            "captured"
    });
    await fee.save();
    res.json({ message: "Payment verified and recorded", fee });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getAllFees = async (req, res) => {
  try {
    const { academicYear, status } = req.query;
    const q = {};
    if (academicYear) q.academicYear = academicYear;
    if (status)       q.status = status;
    res.json(await Fee.find(q).populate("student","name satCode class").sort({ updatedAt: -1 }));
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.recordManualPayment = async (req, res) => {
  try {
    const { studentId, amount, method, date } = req.body;
    const fee = await Fee.findOne({ student: studentId });
    fee.paidAmount += Number(amount);
    fee.payments.push({
      amount,
      date,
      method,
      receiptNumber: "RCP" + Date.now(),
      status: "captured"
    });
    await fee.save();
    await notifyStudentById(
      studentId,
      "Fee payment recorded",
      `A manual fee payment of ₹${Number(amount)} has been recorded.`,
      { url: "/student/fees" }
    ).catch(error => console.warn("Fee manual payment push failed:", error.message));
    res.json({ message: "Manual payment recorded", fee });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const fees = await Fee.find();
    const stats = {
      totalFee: 0,
      totalCollected: 0,
      totalDue: 0,
      statusCounts: { Paid: 0, Partial: 0, Unpaid: 0 }
    };
    fees.forEach(f => {
      stats.totalFee += f.totalFee;
      stats.totalCollected += f.paidAmount;
      stats.totalDue += f.dueAmount;
      stats.statusCounts[f.status]++;
    });
    res.json(stats);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
