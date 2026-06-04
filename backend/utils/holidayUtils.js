const AcademicYear = require("../models/AcademicYear");
const Holiday = require("../models/Holiday");

const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseLocalDate = (dateString) => new Date(`${dateString}T00:00:00`);

const isSunday = (dateString) => parseLocalDate(dateString).getDay() === 0;

const resolveAcademicYear = async (academicYearId) => {
  if (academicYearId) {
    const year = await AcademicYear.findById(academicYearId).lean();
    if (year) return year;
  }
  return AcademicYear.findOne({ isActive: true }).lean();
};

const generateSundays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const holidays = [];

  while (current <= end) {
    if (current.getDay() === 0) {
      holidays.push({
        date: toLocalDateString(current),
        eventName: "Sunday",
        source: "fixed",
        isFixed: true
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return holidays;
};

const getHolidayCalendar = async (academicYearId) => {
  const academicYear = await resolveAcademicYear(academicYearId);
  if (!academicYear) {
    return { academicYear: null, holidays: [] };
  }

  const customHolidays = await Holiday.find({ academicYear: academicYear._id })
    .select("date eventName createdAt updatedAt")
    .sort({ date: 1 })
    .lean();

  const holidayMap = new Map(
    generateSundays(academicYear.startDate, academicYear.endDate).map(holiday => [holiday.date, holiday])
  );

  customHolidays.forEach(holiday => {
    const existing = holidayMap.get(holiday.date);
    holidayMap.set(holiday.date, {
      ...(existing || {}),
      id: holiday._id,
      date: holiday.date,
      eventName: holiday.eventName,
      source: existing ? "fixed+custom" : "custom",
      isFixed: Boolean(existing?.isFixed),
      isCustom: true,
      createdAt: holiday.createdAt,
      updatedAt: holiday.updatedAt
    });
  });

  return {
    academicYear,
    holidays: [...holidayMap.values()].sort((a, b) => a.date.localeCompare(b.date))
  };
};

const isHolidayDate = async (dateString, academicYearId) => {
  const { holidays, academicYear } = await getHolidayCalendar(academicYearId);
  const holiday = holidays.find(item => item.date === dateString) || null;
  return {
    isHoliday: Boolean(holiday),
    holiday,
    academicYear
  };
};

module.exports = {
  toLocalDateString,
  parseLocalDate,
  isSunday,
  resolveAcademicYear,
  generateSundays,
  getHolidayCalendar,
  isHolidayDate
};
