const ExamType = require("../models/ExamType");

const DEFAULT_TYPES = ["Periodic Test", "Mid Term", "Final", "Assignment"];

const ensureDefaultTypes = async () => {
  await Promise.all(DEFAULT_TYPES.map(name => ExamType.updateOne(
    { name },
    { $setOnInsert: { name, isPublished: false } },
    { upsert: true }
  )));
};

exports.getAll = async (req, res) => {
  try {
    await ensureDefaultTypes();
    const filter = { isActive: true };
    if (req.user?.role === "student") filter.isPublished = true;

    const types = await ExamType.find(filter).sort({ createdAt: 1, name: 1 });
    res.json(types);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Exam type name is required" });

    const type = await ExamType.findOneAndUpdate(
      { name },
      { name, description: req.body.description || "", isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(type);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.updateLaunch = async (req, res) => {
  try {
    const isPublished = Boolean(req.body.isPublished);
    const type = await ExamType.findByIdAndUpdate(
      req.params.id,
      {
        isPublished,
        publishedAt: isPublished ? new Date() : null
      },
      { new: true }
    );

    if (!type) return res.status(404).json({ message: "Exam type not found" });
    res.json(type);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
