import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import useActiveAcademicYear from "../../hooks/useActiveAcademicYear";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabels = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDateKey = (dateKey) => new Date(`${dateKey}T00:00:00`);

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return toDateKey(date);
};

const formatDisplayDate = (value) => {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const addMonths = (date, delta) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + delta);
  return new Date(next.getFullYear(), next.getMonth(), 1);
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

export default function Holidays() {
  const { academicYearLabel } = useActiveAcademicYear();
  const [years, setYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [saving, setSaving] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState({ date: "", eventName: "" });
  const [editingHolidayId, setEditingHolidayId] = useState(null);
  const [viewMonth, setViewMonth] = useState(new Date());

  const selectedYear = useMemo(
    () => years.find(year => year._id === selectedYearId) || null,
    [years, selectedYearId]
  );

  const selectedYearStartKey = useMemo(
    () => (selectedYear?.startDate ? formatDateForInput(selectedYear.startDate) : ""),
    [selectedYear]
  );
  const selectedYearEndKey = useMemo(
    () => (selectedYear?.endDate ? formatDateForInput(selectedYear.endDate) : ""),
    [selectedYear]
  );

  const fetchYears = async () => {
    setLoadingYears(true);
    try {
      const { data } = await api.get("/academic-years");
      const ordered = [...(Array.isArray(data) ? data : [])].sort(
        (a, b) => new Date(b.startDate) - new Date(a.startDate)
      );
      setYears(ordered);

      const active = ordered.find(year => year.isActive) || ordered[0] || null;
      if (active) {
        setSelectedYearId(active._id);
        setViewMonth(startOfMonth(new Date(active.startDate)));
      }
    } catch (error) {
      console.error("Failed to load academic years", error);
    } finally {
      setLoadingYears(false);
    }
  };

  const fetchHolidays = async (yearId) => {
    if (!yearId) {
      setHolidays([]);
      setLoadingHolidays(false);
      return;
    }

    setLoadingHolidays(true);
    try {
      const { data } = await api.get(`/holidays?academicYearId=${yearId}`);
      setHolidays(data.holidays || []);
      if (data.academicYear?.startDate) {
        setViewMonth(startOfMonth(new Date(data.academicYear.startDate)));
      }
    } catch (error) {
      console.error("Failed to load holidays", error);
      setHolidays([]);
    } finally {
      setLoadingHolidays(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      fetchHolidays(selectedYearId);
    }
  }, [selectedYearId]);

  const holidayByDate = useMemo(() => {
    const map = new Map();
    holidays.forEach(item => map.set(item.date, item));
    return map;
  }, [holidays]);

  const fixedHolidays = useMemo(() => holidays.filter(item => item.isFixed), [holidays]);
  const customHolidays = useMemo(() => holidays.filter(item => item.isCustom), [holidays]);
  const upcomingHoliday = useMemo(() => {
    const today = toDateKey(new Date());
    return holidays.find(item => item.date >= today) || holidays[0] || null;
  }, [holidays]);

  const yearMonths = useMemo(() => {
    if (!selectedYear?.startDate || !selectedYear?.endDate) return [];
    const start = startOfMonth(new Date(selectedYear.startDate));
    const end = startOfMonth(new Date(selectedYear.endDate));
    const months = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      months.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  }, [selectedYear]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStart.getDay());
    const days = [];

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const dateKey = toDateKey(date);
      const holiday = holidayByDate.get(dateKey) || null;
      const inMonth = date.getMonth() === monthStart.getMonth();
      const inRange = !selectedYearStartKey || !selectedYearEndKey
        ? true
        : dateKey >= selectedYearStartKey && dateKey <= selectedYearEndKey;

      days.push({ date, dateKey, holiday, inMonth, inRange });
    }

    return days;
  }, [viewMonth, holidayByDate, selectedYearStartKey, selectedYearEndKey]);

  const monthSections = useMemo(() => {
    return yearMonths.map(month => {
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
      const items = holidays.filter(item => item.date.startsWith(monthKey));
      return { month, items };
    });
  }, [yearMonths, holidays]);

  const resetForm = () => {
    setForm({ date: "", eventName: "" });
    setEditingHolidayId(null);
  };

  const openCreateFromDate = (dateKey) => {
    const holiday = holidayByDate.get(dateKey) || null;
    setForm({
      date: dateKey,
      eventName: holiday?.id ? holiday.eventName : ""
    });
    setEditingHolidayId(holiday?.id || null);
  };

  const openEdit = (holiday) => {
    if (!holiday?.id) return;
    setEditingHolidayId(holiday.id);
    setForm({ date: holiday.date, eventName: holiday.eventName });
    setViewMonth(startOfMonth(parseDateKey(holiday.date)));
  };

  const handleSave = async () => {
    if (!form.date || !form.eventName.trim()) {
      return alert("Please enter a date and event name.");
    }

    setSaving(true);
    try {
      if (editingHolidayId) {
        await api.patch(`/holidays/${editingHolidayId}`, {
          date: form.date,
          eventName: form.eventName.trim()
        });
      } else {
        await api.post("/holidays", {
          date: form.date,
          eventName: form.eventName.trim(),
          academicYearId: selectedYearId
        });
      }
      resetForm();
      await fetchHolidays(selectedYearId);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save holiday");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (holiday) => {
    if (!holiday?.id) return;
    if (!window.confirm(`Delete "${holiday.eventName}" on ${holiday.date}?`)) return;

    try {
      await api.delete(`/holidays/${holiday.id}`);
      if (editingHolidayId === holiday.id) {
        resetForm();
      }
      await fetchHolidays(selectedYearId);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete holiday");
    }
  };

  const isViewMonthPrevDisabled = selectedYearStartKey
    ? toDateKey(startOfMonth(viewMonth)) <= toDateKey(startOfMonth(parseDateKey(selectedYearStartKey)))
    : false;
  const isViewMonthNextDisabled = selectedYearEndKey
    ? toDateKey(startOfMonth(viewMonth)) >= toDateKey(startOfMonth(parseDateKey(selectedYearEndKey)))
    : false;

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <div>
          <p style={s.eyebrow}>Attendance Settings</p>
          <h1 style={s.title}>Holiday Manager</h1>
          <p style={s.sub}>
            Manage fixed Sundays and custom holidays so attendance stays clean for the full academic year.
          </p>
        </div>
        <div style={s.heroBadge}>AY {academicYearLabel}</div>
      </div>

      <div style={s.toolbar}>
        <label style={s.selectField}>
          <span style={s.label}>Academic Year</span>
          <select
            style={s.select}
            value={selectedYearId}
            onChange={e => setSelectedYearId(e.target.value)}
            disabled={loadingYears}
          >
            {years.map(year => (
              <option key={year._id} value={year._id}>
                {year.year}
              </option>
            ))}
          </select>
        </label>

        <div style={s.summaryStrip}>
          <div style={s.summaryCard}>
            <div style={s.summaryValue}>{holidays.length}</div>
            <div style={s.summaryLabel}>Total Holidays</div>
          </div>
          <div style={s.summaryCard}>
            <div style={s.summaryValue}>{fixedHolidays.length}</div>
            <div style={s.summaryLabel}>Fixed Sundays</div>
          </div>
          <div style={s.summaryCard}>
            <div style={s.summaryValue}>{customHolidays.length}</div>
            <div style={s.summaryLabel}>Custom Holidays</div>
          </div>
          <div style={s.summaryCard}>
            <div style={s.summaryValue}>{upcomingHoliday?.date ? formatDisplayDate(upcomingHoliday.date) : "None"}</div>
            <div style={s.summaryLabel}>Next Holiday</div>
          </div>
        </div>
      </div>

      <div style={s.topGrid}>
        <section style={s.panel}>
          <div style={s.panelHeader}>
            <div>
              <h2 style={s.panelTitle}>Calendar Picker</h2>
              <p style={s.panelSub}>Click any date to create or edit a holiday.</p>
            </div>
            <div style={s.monthNav}>
              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                style={s.navBtn}
                disabled={isViewMonthPrevDisabled}
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              <div style={s.monthTitle}>
                {monthLabels[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </div>
              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                style={s.navBtn}
                disabled={isViewMonthNextDisabled}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>

          <div style={s.calendarWeekdays}>
            {weekdayLabels.map(day => (
              <div key={day} style={s.weekday}>{day}</div>
            ))}
          </div>

          <div style={s.calendarGrid}>
            {loadingHolidays ? (
              <div style={s.empty}>Loading calendar...</div>
            ) : calendarDays.map(({ date, dateKey, holiday, inMonth, inRange }) => {
              const isSelected = form.date === dateKey;
              const isHoliday = Boolean(holiday);
              const isFixedOnly = holiday?.isFixed && !holiday?.id;
              const cellStyle = {
                ...s.dayCell,
                ...(inMonth ? {} : s.dayCellMuted),
                ...(!inRange ? s.dayCellDisabled : {}),
                ...(isHoliday ? s.dayCellHoliday : {}),
                ...(isSelected ? s.dayCellSelected : {})
              };

              return (
                <button
                  key={dateKey}
                  type="button"
                  style={cellStyle}
                  onClick={() => inRange && openCreateFromDate(dateKey)}
                  disabled={!inRange}
                >
                  <div style={s.dayNumber}>{date.getDate()}</div>
                  {isHoliday ? (
                    <div style={s.dayTagWrap}>
                      <span style={isFixedOnly ? s.fixedPill : s.customPill}>
                        {isFixedOnly ? "Sunday" : "Holiday"}
                      </span>
                      <span style={s.dayEvent}>{holiday.eventName}</span>
                    </div>
                  ) : (
                    <span style={s.dayHint}>Add holiday</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section style={s.panel}>
          <div style={s.panelHeader}>
            <div>
              <h2 style={s.panelTitle}>{editingHolidayId ? "Edit Holiday" : "Add Holiday"}</h2>
              <p style={s.panelSub}>Use the calendar or form to set the date and event name.</p>
            </div>
          </div>

          <div style={s.formCard}>
            <label style={s.field}>
              <span style={s.label}>Holiday Date</span>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                style={s.input}
              />
            </label>
            <label style={s.field}>
              <span style={s.label}>Event Name</span>
              <input
                type="text"
                value={form.eventName}
                onChange={e => setForm(prev => ({ ...prev, eventName: e.target.value }))}
                placeholder="e.g. Annual Day, Christmas, Sports Meet"
                style={s.input}
              />
            </label>

            <div style={s.formActions}>
              {editingHolidayId && (
                <button type="button" onClick={resetForm} style={s.cancelBtn}>
                  Cancel Edit
                </button>
              )}
              <button type="button" onClick={handleSave} disabled={saving} style={s.saveBtn}>
                <i className="fa-solid fa-floppy-disk" style={{ marginRight: 8 }} />
                {saving ? "Saving..." : editingHolidayId ? "Save Changes" : "Add Holiday"}
              </button>
            </div>
          </div>

          <div style={s.smallNote}>
            Sundays are auto-generated for the selected academic year. Custom holidays are added separately and can be edited or removed.
          </div>

          {upcomingHoliday && (
            <div style={s.nextHolidayCard}>
              <div style={s.nextHolidayLabel}>Upcoming holiday</div>
              <div style={s.nextHolidayTitle}>{upcomingHoliday.eventName}</div>
              <div style={s.nextHolidayMeta}>{formatDisplayDate(upcomingHoliday.date)}</div>
            </div>
          )}
        </section>
      </div>

      <div style={s.listHeader}>
        <h2 style={s.panelTitle}>Yearly Holiday List</h2>
        <p style={s.panelSub}>Grouped by month for quick review and editing.</p>
      </div>

      <div style={s.monthList}>
        {loadingHolidays ? (
          <div style={s.empty}>Loading holidays...</div>
        ) : monthSections.length ? monthSections.map(({ month, items }) => (
          <section key={`${month.getFullYear()}-${month.getMonth()}`} style={s.monthCard}>
            <div style={s.monthCardHeader}>
              <div>
                <div style={s.monthCardTitle}>{monthLabels[month.getMonth()]} {month.getFullYear()}</div>
                <div style={s.monthCardMeta}>{items.length} holiday{items.length === 1 ? "" : "s"}</div>
              </div>
              <button
                type="button"
                style={s.smallLinkBtn}
                onClick={() => setViewMonth(new Date(month.getFullYear(), month.getMonth(), 1))}
              >
                View Calendar
              </button>
            </div>

            {items.length ? (
              <div style={s.monthItems}>
                {items.map(item => (
                  <div key={item.id || item.date} style={s.monthRow}>
                    <div>
                      <div style={s.monthRowTitle}>{item.eventName}</div>
                      <div style={s.monthRowMeta}>{formatDisplayDate(item.date)}</div>
                    </div>
                    <div style={s.monthRowActions}>
                      <span style={item.isFixed && !item.id ? s.fixedPill : s.customPill}>
                        {item.isFixed && !item.id ? "Sunday" : item.source === "fixed+custom" ? "Fixed + Custom" : "Custom"}
                      </span>
                      {item.id ? (
                        <>
                          <button type="button" style={s.actionBtn} onClick={() => openEdit(item)}>
                            Edit
                          </button>
                          <button type="button" style={s.dangerBtn} onClick={() => handleDelete(item)}>
                            Delete
                          </button>
                        </>
                      ) : (
                        <span style={s.autoText}>Auto generated</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={s.empty}>No holidays in this month.</div>
            )}
          </section>
        )) : <div style={s.empty}>No holidays found for this academic year.</div>}
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", flexDirection: "column", gap: "20px" },
  hero: {
    background: "linear-gradient(135deg, var(--navy-dark), var(--navy))",
    borderRadius: "20px",
    padding: "28px 30px",
    color: "var(--white)",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start"
  },
  eyebrow: { margin: 0, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: "0.72rem", color: "var(--gold-pale)" },
  title: { margin: "8px 0 10px", fontFamily: "var(--font-heading)", fontSize: "2rem" },
  sub: { margin: 0, maxWidth: "780px", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 },
  heroBadge: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "var(--white)",
    padding: "10px 14px",
    borderRadius: "999px",
    fontWeight: 800,
    whiteSpace: "nowrap"
  },
  toolbar: { display: "flex", flexDirection: "column", gap: "16px" },
  selectField: { display: "flex", flexDirection: "column", gap: "8px", maxWidth: "340px" },
  label: { fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gold)" },
  select: {
    height: "46px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    padding: "0 14px",
    fontSize: "0.95rem",
    color: "var(--navy)"
  },
  summaryStrip: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" },
  summaryCard: { background: "var(--white)", borderRadius: "16px", padding: "18px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" },
  summaryValue: { fontSize: "1.25rem", fontWeight: 900, color: "var(--navy)", lineHeight: 1.2 },
  summaryLabel: { marginTop: "6px", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" },
  topGrid: { display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: "16px", alignItems: "start" },
  panel: { background: "var(--white)", borderRadius: "18px", padding: "20px", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" },
  panelHeader: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px", marginBottom: "16px" },
  panelTitle: { margin: 0, fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.05rem" },
  panelSub: { margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem" },
  monthNav: { display: "flex", alignItems: "center", gap: "10px" },
  monthTitle: { fontWeight: 900, color: "var(--navy)" },
  navBtn: { width: "36px", height: "36px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--light-bg)", color: "var(--navy)", cursor: "pointer" },
  calendarWeekdays: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "8px" },
  weekday: { textAlign: "center", fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.08em", color: "var(--gold)" },
  calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "8px" },
  dayCell: {
    minHeight: "96px",
    textAlign: "left",
    borderRadius: "14px",
    border: "1px solid var(--border)",
    background: "var(--light-bg)",
    padding: "10px",
    color: "var(--navy)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    cursor: "pointer"
  },
  dayCellMuted: { opacity: 0.55 },
  dayCellDisabled: { opacity: 0.3, cursor: "not-allowed" },
  dayCellHoliday: {
    background: "linear-gradient(135deg, rgba(200,150,12,0.14), rgba(14,107,107,0.06))",
    borderColor: "rgba(200,150,12,0.28)"
  },
  dayCellSelected: {
    outline: "2px solid var(--navy)",
    outlineOffset: "1px"
  },
  dayNumber: { fontWeight: 900, fontSize: "0.95rem" },
  dayTagWrap: { display: "flex", flexDirection: "column", gap: "6px" },
  dayEvent: { fontSize: "0.75rem", fontWeight: 700, color: "var(--text)" },
  dayHint: { marginTop: "auto", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 },
  fixedPill: { background: "rgba(14,107,107,0.12)", color: "var(--navy)", padding: "6px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 800, display: "inline-flex", width: "fit-content" },
  customPill: { background: "rgba(200,150,12,0.16)", color: "var(--navy-dark)", padding: "6px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 800, display: "inline-flex", width: "fit-content" },
  formCard: { display: "flex", flexDirection: "column", gap: "14px", marginTop: "6px" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  input: {
    height: "46px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    padding: "0 14px",
    fontSize: "0.95rem",
    color: "var(--navy)"
  },
  formActions: { display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap", marginTop: "4px" },
  saveBtn: {
    border: "none",
    background: "linear-gradient(135deg, var(--navy), var(--navy-dark))",
    color: "var(--white)",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer"
  },
  cancelBtn: {
    border: "1px solid var(--border)",
    background: "var(--light-bg)",
    color: "var(--text-muted)",
    padding: "12px 18px",
    borderRadius: "12px",
    fontWeight: 800,
    cursor: "pointer"
  },
  smallNote: {
    marginTop: "14px",
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    lineHeight: 1.6,
    background: "var(--light-bg)",
    border: "1px dashed var(--border)",
    borderRadius: "12px",
    padding: "12px 14px"
  },
  nextHolidayCard: {
    marginTop: "14px",
    background: "linear-gradient(135deg, rgba(14,107,107,0.08), rgba(200,150,12,0.1))",
    border: "1px solid rgba(200,150,12,0.18)",
    borderRadius: "14px",
    padding: "14px 16px"
  },
  nextHolidayLabel: { fontSize: "0.72rem", fontWeight: 900, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em" },
  nextHolidayTitle: { marginTop: "6px", fontSize: "1rem", fontWeight: 900, color: "var(--navy)" },
  nextHolidayMeta: { marginTop: "4px", color: "var(--text-muted)", fontSize: "0.85rem" },
  listHeader: { display: "flex", flexDirection: "column", gap: "4px" },
  monthList: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" },
  monthCard: { background: "var(--white)", borderRadius: "18px", padding: "18px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" },
  monthCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "14px" },
  monthCardTitle: { fontWeight: 900, color: "var(--navy)", fontSize: "1rem" },
  monthCardMeta: { marginTop: "4px", color: "var(--text-muted)", fontSize: "0.8rem" },
  smallLinkBtn: { border: "none", background: "transparent", color: "var(--gold)", fontWeight: 900, cursor: "pointer" },
  monthItems: { display: "flex", flexDirection: "column", gap: "10px" },
  monthRow: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", padding: "12px 14px", borderRadius: "14px", background: "var(--light-bg)", border: "1px solid var(--border)" },
  monthRowTitle: { fontWeight: 900, color: "var(--navy)" },
  monthRowMeta: { marginTop: "4px", color: "var(--text-muted)", fontSize: "0.82rem" },
  monthRowActions: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" },
  actionBtn: { border: "1px solid var(--navy)", background: "var(--white)", color: "var(--navy)", padding: "6px 12px", borderRadius: "10px", fontWeight: 800, cursor: "pointer" },
  dangerBtn: { border: "1px solid #dc2626", background: "var(--white)", color: "#dc2626", padding: "6px 12px", borderRadius: "10px", fontWeight: 800, cursor: "pointer" },
  autoText: { color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 },
  empty: { padding: "18px", textAlign: "center", color: "var(--text-muted)", border: "1px dashed var(--border)", borderRadius: "12px", background: "var(--light-bg)" }
};
