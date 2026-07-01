import React, { useMemo } from "react";

const monthLabels = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const pad = value => String(value).padStart(2, "0");

const parseDate = value => {
  if (!value || typeof value !== "string") return new Date();
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDate = date =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const compareDateStrings = (a, b) => String(a).localeCompare(String(b));

export default function MonthDatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  allowedDates,
  helperText,
  inputStyle,
  wrapperStyle,
  labelStyle,
  rowStyle,
  fieldStyle
}) {
  const hasValue = typeof value === "string" && value.trim().length > 0;
  const current = hasValue ? parseDate(value) : null;
  const fallbackDate = new Date();
  const selectedYear = hasValue ? current.getFullYear() : "";
  const selectedMonth = hasValue ? current.getMonth() : "";
  const selectedDay = hasValue ? current.getDate() : "";
  const allowedSet = useMemo(
    () => (Array.isArray(allowedDates) && allowedDates.length > 0 ? new Set(allowedDates) : null),
    [allowedDates]
  );

  const yearOptions = useMemo(() => {
    const currentYear = fallbackDate.getFullYear();
    const minYear = minDate ? parseDate(minDate).getFullYear() : currentYear - 10;
    const maxYear = maxDate ? parseDate(maxDate).getFullYear() : currentYear + 10;
    const years = [];
    for (let year = minYear; year <= maxYear; year += 1) {
      years.push(year);
    }
    return years;
  }, [minDate, maxDate]);

  const dayOptions = useMemo(() => {
    if (!hasValue) return [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const candidate = `${selectedYear}-${pad(selectedMonth + 1)}-${pad(day)}`;
      if (minDate && compareDateStrings(candidate, minDate) < 0) continue;
      if (maxDate && compareDateStrings(candidate, maxDate) > 0) continue;
      if (allowedSet && !allowedSet.has(candidate)) continue;
      days.push(day);
    }
    return days;
  }, [hasValue, selectedYear, selectedMonth, minDate, maxDate, allowedSet]);

  const baseStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1.5px solid var(--border)",
    background: "var(--white)",
    color: "var(--navy)",
    fontWeight: "700",
    fontFamily: "var(--font-body)",
    fontSize: "0.95rem",
    boxSizing: "border-box",
    ...inputStyle
  };

  const updateDate = (nextYear, nextMonth, preferredDay = selectedDay) => {
    const yearValue = Number.isFinite(nextYear) ? nextYear : fallbackDate.getFullYear();
    const monthValue = Number.isFinite(nextMonth) ? nextMonth : fallbackDate.getMonth();
    const daysInMonth = new Date(yearValue, monthValue + 1, 0).getDate();
    const candidateDays = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const candidate = `${yearValue}-${pad(monthValue + 1)}-${pad(day)}`;
      if (minDate && compareDateStrings(candidate, minDate) < 0) continue;
      if (maxDate && compareDateStrings(candidate, maxDate) > 0) continue;
      if (allowedSet && !allowedSet.has(candidate)) continue;
      candidateDays.push(day);
    }
    if (candidateDays.length === 0) return;
    const nextDay = candidateDays.includes(preferredDay) ? preferredDay : candidateDays[0];
    onChange(formatDate(new Date(yearValue, monthValue, nextDay)));
  };

  const handleMonthChange = e => {
    const nextMonth = Number(e.target.value);
    const nextYear = hasValue ? selectedYear : fallbackDate.getFullYear();
    updateDate(nextYear, nextMonth, hasValue ? selectedDay : 1);
  };
  const handleYearChange = e => {
    const nextYear = Number(e.target.value);
    const nextMonth = hasValue ? selectedMonth : fallbackDate.getMonth();
    updateDate(nextYear, nextMonth, hasValue ? selectedDay : 1);
  };
  const handleDayChange = e => {
    const day = Number(e.target.value);
    const yearValue = hasValue ? selectedYear : fallbackDate.getFullYear();
    const monthValue = hasValue ? selectedMonth : fallbackDate.getMonth();
    onChange(formatDate(new Date(yearValue, monthValue, day)));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", ...wrapperStyle }}>
      {label && <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em", ...labelStyle }}>{label}</label>}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.9fr", gap: "10px", ...rowStyle }}>
        <select style={baseStyle} value={hasValue ? selectedMonth : ""} onChange={handleMonthChange} aria-label={label ? `${label} month` : "Month"}>
          <option value="" disabled>Select Month</option>
          {monthLabels.map((monthName, index) => (
            <option key={monthName} value={index}>{monthName}</option>
          ))}
        </select>
        <select style={baseStyle} value={hasValue ? selectedYear : ""} onChange={handleYearChange} aria-label={label ? `${label} year` : "Year"}>
          <option value="" disabled>Select Year</option>
          {yearOptions.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <select style={baseStyle} value={hasValue && dayOptions.includes(selectedDay) ? selectedDay : ""} onChange={handleDayChange} aria-label={label ? `${label} day` : "Day"} disabled={dayOptions.length === 0}>
          <option value="" disabled>Select Day</option>
          {dayOptions.map(day => (
            <option key={day} value={day}>{pad(day)}</option>
          ))}
        </select>
      </div>
      {helperText && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5, ...fieldStyle }}>{helperText}</div>}
    </div>
  );
}
