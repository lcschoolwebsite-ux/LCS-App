const FeeType = require("../models/FeeType");
const AcademicYear = require("../models/AcademicYear");

exports.getAll = async (req, res) => {
  try {
    const { academicYear } = req.query;
    let ayId = academicYear;
    
    if (!ayId) {
      const activeYear = await AcademicYear.findOne({ isActive: true });
      ayId = activeYear?._id;
    }

    const types = await FeeType.find({ 
      academicYear: ayId,
      isActive: true 
    });
    res.json(types);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const activeYear = await AcademicYear.findOne({ isActive: true });
    const type = new FeeType({
      ...req.body,
      academicYear: activeYear._id
    });
    await type.save();
    res.status(201).json(type);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await FeeType.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Fee type removed" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
