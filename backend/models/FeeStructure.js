const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema({
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear", required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  feeItems: [
    {
      feeType: { type: mongoose.Schema.Types.ObjectId, ref: "FeeType" },
      amount: { type: Number, required: true }
    }
  ],
  totalAnnualFee: { type: Number, required: true },
  createdBy: { type: String, default: "admin" }
}, { timestamps: true });

module.exports = mongoose.model("FeeStructure", feeStructureSchema);
