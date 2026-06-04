const Holiday = require("../models/Holiday");
const { getHolidayCalendar, resolveAcademicYear, isSunday } = require("../utils/holidayUtils");

exports.getHolidays = async (req, res) => {
  try {
    const academicYearId = req.query.academicYearId || req.query.yearId;
    const { academicYear, holidays } = await getHolidayCalendar(academicYearId);
    res.json({
      academicYear: academicYear
        ? { _id: academicYear._id, year: academicYear.year, startDate: academicYear.startDate, endDate: academicYear.endDate }
        : null,
      holidays
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const { date, eventName, academicYearId } = req.body;
    if (!date || !eventName) {
      return res.status(400).json({ message: "Date and event name are required" });
    }

    const academicYear = await resolveAcademicYear(academicYearId);
    if (!academicYear) {
      return res.status(400).json({ message: "No active academic year found" });
    }

    const holiday = await Holiday.findOneAndUpdate(
      { academicYear: academicYear._id, date },
      { academicYear: academicYear._id, date, eventName: eventName.trim(), createdBy: req.user?.id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      _id: holiday._id,
      date: holiday.date,
      eventName: holiday.eventName,
      isSunday: isSunday(date),
      academicYear: academicYear._id
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    const { date, eventName } = req.body;
    if (!date || !eventName) {
      return res.status(400).json({ message: "Date and event name are required" });
    }

    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      { date, eventName: eventName.trim() },
      { new: true, runValidators: true }
    );

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    res.json({
      _id: holiday._id,
      date: holiday.date,
      eventName: holiday.eventName,
      isSunday: isSunday(date),
      academicYear: holiday.academicYear
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const removed = await Holiday.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Holiday not found" });
    res.json({ message: "Holiday deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
