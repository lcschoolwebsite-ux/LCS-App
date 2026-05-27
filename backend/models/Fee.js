const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount:          { type: Number, required: true },
  date:            { type: String },
  method:          { type: String, enum: ["Online","Cash","Cheque","DD"], default: "Online" },
  razorpayOrderId: { type: String },
  razorpayPaymentId:{ type: String },
  receiptNumber:   { type: String },
  status:          { type: String, enum: ["pending","captured","failed"], default: "pending" },
}, { timestamps: true });

const feeSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, unique: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  totalFee:     { type: Number, required: true },
  paidAmount:   { type: Number, default: 0 },
  dueAmount:    { type: Number },
  status:       { type: String, enum: ["Paid","Partial","Unpaid"], default: "Unpaid" },
  payments:     [paymentSchema],
}, { timestamps: true });

feeSchema.pre("save", function (next) {
  this.dueAmount = Math.max(0, this.totalFee - this.paidAmount);
  this.status    = this.dueAmount === 0 ? "Paid"
                 : this.paidAmount > 0  ? "Partial"
                 : "Unpaid";
  next();
});

module.exports = mongoose.model("Fee", feeSchema);
