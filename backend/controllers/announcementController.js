const Announcement = require("../models/Announcement");
const { getIO } = require("../utils/socket");

exports.getAll = async (req, res) => {
  const { audience, classId, academicYear } = req.query;
  const role = String(req.user?.role || "").toLowerCase();
  const q = {};

  if (audience) {
    q.$or = [{ audience: "all" }, { audience }];
  } else if (role !== "admin") {
    q.$or = [{ audience: "all" }, { audience: role }];
  }

  if (classId) q.class = classId;
  if (academicYear) q.academicYear = academicYear;

  res.json(
    await Announcement.find(q)
      .populate("class", "name section")
      .populate("academicYear", "year name")
      .sort({ pinned: -1, createdAt: -1 })
  );
};

exports.create = async (req, res) => {
  try {
    const a = await Announcement.create({
      ...req.body,
      createdBy: req.user.name || req.user.id || "admin"
    });
    const announcementWithUser = await Announcement.findById(a._id);
    
    // Notify all clients
    getIO().emit("new-announcement", announcementWithUser);
    
    res.status(201).json(a);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.togglePin = async (req, res) => {
  try {
    const a = await Announcement.findById(req.params.id);
    a.pinned = !a.pinned;
    await a.save();
    res.json(a);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
