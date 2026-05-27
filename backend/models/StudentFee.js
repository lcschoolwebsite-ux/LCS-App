const mongoose = require("mongoose");

const studentFeeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  feeStructure: { type: mongoose.Schema.Types.ObjectId, ref: "FeeStructure", required: true },
  totalAnnualFee: { type: Number, required: true },
  termPlan: {
    type: String,
    enum: ["Annual", "Half-yearly", "Quarterly"],
    set: value => (value == null || value === "" ? undefined : value)
  },
  termsCount: { type: Number },
  amountPerTerm: { type: Number },
  terms: [
    {
      termNumber: { type: Number, required: true },
      termName: { type: String, required: true },
      amount: { type: Number, required: true },
      status: { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid" },
      paidDate: { type: String },
      paidAmount: { type: Number, default: 0 },
      method: { type: String, enum: ["Cash", "Cheque", "Online", "DD", "Bank Transfer"] },
      receiptNumber: { type: String },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
      receiptGeneratedAt: { type: Date }
    }
  ],
  totalPaid: { type: Number, default: 0 },
  totalDue: { type: Number, required: true },
  overallStatus: { 
    type: String, 
    enum: ["Paid", "Partial", "Unpaid"], 
    default: "Unpaid" 
  }
}, { timestamps: true });

studentFeeSchema.pre("save", function(next) {
  this.totalPaid = this.terms
    .filter(t => t.status === "Paid")
    .reduce((sum, t) => sum + (t.paidAmount || t.amount), 0);
    
  this.totalDue = this.totalAnnualFee - this.totalPaid;
  
  if (this.totalDue <= 0) {
    this.overallStatus = "Paid";
  } else if (this.totalPaid > 0) {
    this.overallStatus = "Partial";
  } else {
    this.overallStatus = "Unpaid";
  }
  
  next();
});

studentFeeSchema.index({ student: 1, academicYear: 1 }, { unique: true });
studentFeeSchema.index({ academicYear: 1, overallStatus: 1 });
studentFeeSchema.index({ feeStructure: 1 });

module.exports = mongoose.model("StudentFee", studentFeeSchema);
