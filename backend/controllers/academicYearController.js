const AcademicYear = require("../models/AcademicYear");

exports.getAll    = async (req, res) => res.json(await AcademicYear.find().sort({ createdAt: -1 }));
exports.getActive = async (req, res) => res.json(await AcademicYear.findOne({ isActive: true }));

exports.create = async (req, res) => {
  try {
    const ay = await AcademicYear.create(req.body);
    res.status(201).json(ay);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { year, startDate, endDate } = req.body;
    const ay = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      { year, startDate, endDate },
      { new: true, runValidators: true }
    );

    if (!ay) {
      return res.status(404).json({ message: "Academic year not found" });
    }

    res.json(ay);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.setActive = async (req, res) => {
  try {
    await AcademicYear.updateMany({}, { isActive: false });
    const ay = await AcademicYear.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.json(ay);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await AcademicYear.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
