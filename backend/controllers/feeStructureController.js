const FeeStructure = require("../models/FeeStructure");
const Student = require("../models/Student");
const StudentFee = require("../models/StudentFee");
const AcademicYear = require("../models/AcademicYear");

exports.getAll = async (req, res) => {
  try {
    const { academicYear, classId } = req.query;
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (classId) filter.class = classId;

    const structures = await FeeStructure.find(filter)
      .populate("class")
      .populate("feeItems.feeType");
    res.json(structures);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const structure = await FeeStructure.findById(req.params.id)
      .populate("class")
      .populate("feeItems.feeType");
    res.json(structure);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.createOrUpdate = async (req, res) => {
  try {
    const { academicYear, class: classId, feeItems } = req.body;
    const totalAnnualFee = feeItems.reduce((sum, item) => sum + Number(item.amount), 0);

    const structure = await FeeStructure.findOneAndUpdate(
      { academicYear, class: classId },
      { 
        academicYear, class: classId, feeItems, 
        totalAnnualFee 
      },
      { upsert: true, new: true }
    );

    const studentsUpdated = await assignFeeStructureToStudents(structure._id);
    res.json({ structure, studentsUpdated });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await FeeStructure.findByIdAndDelete(req.params.id);
    res.json({ message: "Structure deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

async function assignFeeStructureToStudents(structureId) {
  console.log("Syncing structure:", structureId);
  const structure = await FeeStructure.findById(structureId);
  console.log("Structure details:", { class: structure.class, ay: structure.academicYear });
  
  const students = await Student.find({ 
    class: structure.class, 
    academicYear: structure.academicYear,
    isActive: true 
  });
  console.log(`Found ${students.length} students to update.`);

  let count = 0;
  for (const student of students) {
    console.log("Updating student:", student.name);
    let studentFee = await StudentFee.findOne({ 
      student: student._id, 
      academicYear: structure.academicYear 
    });

    if (!studentFee) {
      console.log("Creating new fee record for", student.name);
      studentFee = new StudentFee({
        student: student._id,
        academicYear: structure.academicYear,
        feeStructure: structure._id,
        totalAnnualFee: structure.totalAnnualFee,
        totalDue: structure.totalAnnualFee,
        terms: []
      });
    } else {
      console.log("Updating existing fee record for", student.name, "from", studentFee.totalAnnualFee, "to", structure.totalAnnualFee);
      studentFee.feeStructure = structure._id;
      studentFee.totalAnnualFee = structure.totalAnnualFee;
      // Reset plan and terms so student picks again with new total
      studentFee.terms = [];
      studentFee.termPlan = undefined;
      studentFee.termsCount = undefined;
      studentFee.amountPerTerm = undefined;
      studentFee.totalPaid = 0;
      studentFee.totalDue = structure.totalAnnualFee;
    }

    await studentFee.save();
    count++;
  }
  return count;
}

exports.assignFeeStructureToStudents = assignFeeStructureToStudents;
