const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const StudentFee = require("../models/StudentFee");

exports.getOverview = async (req, res) => {
  try {
    const [students, teachers, classes, feeTotals] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Teacher.countDocuments({ isActive: true }),
      Class.countDocuments(),
      StudentFee.aggregate([
        {
          $group: {
            _id: null,
            totalFee: { $sum: "$totalAnnualFee" },
            collected: { $sum: "$totalPaid" },
            pending: { $sum: "$totalDue" }
          }
        }
      ])
    ]);

    const totals = feeTotals[0] || { totalFee: 0, collected: 0, pending: 0 };
    const feeStats = {
      totalFee: totals.totalFee,
      collected: totals.collected,
      pending: totals.pending,
      percentageCollected: 0
    };

    if (feeStats.totalFee > 0) {
      feeStats.percentageCollected = (feeStats.collected / feeStats.totalFee) * 100;
    }

    res.json({
      totalStudents: students,
      totalTeachers: teachers,
      totalClasses: classes,
      feeStats
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getFeeTrend = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const filter = academicYear ? { academicYear } : {};
    const fees = await StudentFee.find(filter).select("terms");
    
    // Group by month
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trend = months.map(m => ({ month: m, collected: 0 }));

    fees.forEach(f => {
      f.terms
        .filter(term => term.status === "Paid" && term.paidDate)
        .forEach(term => {
          const monthIndex = new Date(term.paidDate).getMonth();
          if (monthIndex >= 0) trend[monthIndex].collected += term.paidAmount || term.amount || 0;
      });
    });

    res.json(trend);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
