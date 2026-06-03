const StudentLoginLog = require("../models/StudentLoginLog");

exports.getAll = async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const logs = await StudentLoginLog.find()
      .where("createdAt").gte(cutoff)
      .sort({ createdAt: -1 })
      .lean();

    res.json(logs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
