const Class = require("../models/Class");

exports.getAll = async (req, res) => {
  const { academicYear } = req.query;
  const q = academicYear ? { academicYear } : {};
  res.json(await Class.find(q).populate("academicYear","year").populate("classTeacher","name"));
};

exports.create = async (req, res) => {
  try { res.status(201).json(await Class.create(req.body)); }
  catch (e) { res.status(400).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try { res.json(await Class.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(400).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try { await Class.findByIdAndDelete(req.params.id); res.json({ message: "Deleted" }); }
  catch (e) { res.status(500).json({ message: e.message }); }
};
