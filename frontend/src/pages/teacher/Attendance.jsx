import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import SectionTitle from "../../components/SectionTitle";
import MonthDatePicker from "../../components/MonthDatePicker";
import { getTeacherAssignedClasses, isClassTeacher } from "../../utils/teacherClasses";

const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

const formatAttendanceDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

export default function Attendance() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedClass, setSelectedClass] = useState(searchParams.get("classId") || "");
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [classes, setClasses] = useState([]);
  const [markedDates, setMarkedDates] = useState([]);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [holidayInfo, setHolidayInfo] = useState(null);
  const [holidaySummary, setHolidaySummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Set default class if available
  useEffect(() => {
    const classFromUrl = searchParams.get("classId");
    if (classFromUrl && classFromUrl !== selectedClass) {
      setSelectedClass(classFromUrl);
      return;
    }
  }, [selectedClass, searchParams]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await api.get("/classes");
        setClasses(data || []);
      } catch (e) {
        console.error("Failed to load class list", e);
      }
    };
    fetchClasses();
  }, []);

  const assignedClasses = useMemo(() => getTeacherAssignedClasses(user, classes), [user, classes]);
  const allowedClasses = useMemo(() => assignedClasses.filter(c => isClassTeacher(user, c)), [assignedClasses, user]);

  useEffect(() => {
    if (searchParams.get("classId")) return;
    if (allowedClasses.length > 0 && !selectedClass) {
      const defaultClassId = allowedClasses[0]._id;
      setSelectedClass(defaultClassId);
      const next = new URLSearchParams(searchParams);
      next.set("classId", defaultClassId);
      setSearchParams(next, { replace: true });
    }
  }, [allowedClasses, selectedClass, searchParams, setSearchParams]);

  const handleClassChange = (value) => {
    setSelectedClass(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set("classId", value);
    else next.delete("classId");
    setSearchParams(next, { replace: true });
  };

  const fetchMarkedDates = useCallback(async () => {
    if (!selectedClass || !allowedClasses.some(c => String(c._id) === String(selectedClass))) return;
    try {
      const { data } = await api.get(`/attendance/dates?classId=${selectedClass}`);
      setMarkedDates(data);
    } catch (e) {
      console.error("Failed to load attendance dates", e);
      setMarkedDates([]);
    }
  }, [selectedClass, allowedClasses]);

  useEffect(() => {
    fetchMarkedDates();
  }, [fetchMarkedDates]);

  useEffect(() => {
    const fetchHolidaySummary = async () => {
      try {
        const { data } = await api.get("/attendance/holiday-summary");
        setHolidaySummary(data);
      } catch (e) {
        console.error("Failed to load holiday summary", e);
      }
    };

    fetchHolidaySummary();
  }, []);

  const fetchAttendance = useCallback(async () => {
    if (!selectedClass || !selectedDate || !allowedClasses.some(c => String(c._id) === String(selectedClass))) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance?classId=${selectedClass}&date=${selectedDate}`);
      setHolidayInfo(data.isHoliday ? data.holiday : null);
      setAlreadyMarked(Boolean(data.alreadyMarked));
      const mapped = data.isHoliday ? [] : data.students.map(s => ({
        ...s,
        status: s.absent ? "absent" : "present"
      }));
      setStudents(mapped);
    } catch (e) {
      alert("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate, allowedClasses]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const toggleStatus = (id) => {
    setStudents(prev => prev.map(s => 
      s._id === id ? { ...s, status: s.status === "present" ? "absent" : "present" } : s
    ));
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (!selectedClass || !allowedClasses.some(c => String(c._id) === String(selectedClass))) return alert("Please select a class you teach.");
    setSaving(true);
    const absentIds = students.filter(s => s.status === "absent").map(s => s._id);
    try {
      await api.post("/attendance", {
        classId: selectedClass,
        date: selectedDate,
        absentIds
      });
      alert("Attendance records updated successfully!");
      setAlreadyMarked(true);
      fetchMarkedDates();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const today = getLocalDate();
  const pastDateOptions = markedDates
    .filter(record => record.date !== today)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 3);
  const selectedHoliday = holidayInfo;
  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;

  return (
    <div>
      <SectionTitle title="Mark Attendance" subtitle="Select a date and class to record student presence." />

      {allowedClasses.length === 0 ? (
        <div style={s.empty}>Attendance is only available for classes where you are assigned as the class teacher.</div>
      ) : (
        <>

      <div style={s.headerCard}>
        <div style={s.controlsRow} className="teacher-attendance-header">
          <div style={{flex: 1.5}}>
            <label style={s.label}>1. Select Class & Section</label>
            <div style={s.inputWrap}>
              <i className="fa-solid fa-users-rectangle" style={s.inputIcon}></i>
              <select style={s.inputWithIcon} value={selectedClass} onChange={e => handleClassChange(e.target.value)}>
                <option value="" disabled>Choose a class...</option>
                {allowedClasses.map(c => (
                  <option key={c._id} value={c._id}>{c.name} {c.section}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{flex: 1}}>
            <label style={s.label}>2. Select Date</label>
            <MonthDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              maxDate={today}
              inputStyle={s.datePickerInput}
              wrapperStyle={{ gap: "6px" }}
              labelStyle={{ display: "none" }}
              rowStyle={s.datePickerRow}
              fieldStyle={s.dateHint}
              className="teacher-attendance-date-picker"
              rowClassName="teacher-attendance-date-picker-row"
              helperText="Pick a month first, then the day. Current day is prefilled, and previously marked dates are listed below."
            />
          </div>
        </div>

        <div style={s.holidayWidget}>
          <div style={s.widgetHeader}>
            <div>
              <p style={s.widgetEyebrow}>Holiday Summary</p>
              <h3 style={s.widgetTitle}>Attendance-safe calendar</h3>
            </div>
            <i className="fa-solid fa-umbrella-beach" style={s.widgetIcon}></i>
          </div>
          <div style={s.widgetGrid}>
            <div style={s.widgetStat}>
              <span style={s.widgetLabel}>Total Holidays</span>
              <strong style={s.widgetValue}>{holidaySummary?.totalHolidays ?? "..."}</strong>
            </div>
            <div style={s.widgetStat}>
              <span style={s.widgetLabel}>Fixed Sundays</span>
              <strong style={s.widgetValue}>{holidaySummary?.fixedHolidays ?? "..."}</strong>
            </div>
            <div style={s.widgetStat}>
              <span style={s.widgetLabel}>Next Holiday</span>
              <strong style={s.widgetValue}>{holidaySummary?.upcomingHoliday?.eventName || "Not set"}</strong>
              <span style={s.widgetMeta}>
                {holidaySummary?.upcomingHoliday?.date
                  ? formatAttendanceDate(holidaySummary.upcomingHoliday.date)
                  : "No upcoming holiday"}
              </span>
            </div>
          </div>
        </div>

        {selectedHoliday ? (
          <div style={s.warningBanner}>
            <i className="fa-solid fa-umbrella-beach" style={{marginRight: '8px', color: 'var(--gold)'}}></i>
            <strong>{selectedHoliday.eventName}</strong> on <strong>{formatAttendanceDate(selectedDate)}</strong> is a holiday. Attendance is not counted on this date.
          </div>
        ) : alreadyMarked && (
          <div style={s.warningBanner}>
            <i className="fa-solid fa-circle-check" style={{marginRight: '8px', color: 'var(--success-text)'}}></i>
            Records already exist for <strong>{formatAttendanceDate(selectedDate)}</strong>. Saving will update the existing log.
          </div>
        )}
        {pastDateOptions.length > 0 && (
          <div style={s.markedDatesRow}>
            <span style={s.markedDatesLabel}>Previously marked dates:</span>
            <div style={s.markedDatesList}>
              {pastDateOptions.map(record => (
                <button
                  key={record.date}
                  type="button"
                  style={selectedDate === record.date ? s.markedDateActive : s.markedDateBtn}
                  onClick={() => setSelectedDate(record.date)}
                >
                  {formatAttendanceDate(record.date)} <span style={s.markedDateMeta}>({record.absentCount} absent)</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={s.loading}><i className="fa-solid fa-circle-notch fa-spin"></i> Loading student list...</div>
      ) : students.length === 0 ? (
        <div style={s.empty}>Please select a class to view students.</div>
      ) : (
        <>
          <div style={s.bulkRow}>
            <div style={s.bulkBtns}>
              <button style={{...s.btnOutline, color: 'var(--success-text)', borderColor: 'var(--success-text)'}} onClick={() => markAll('present')}>
                Mark All Present
              </button>
              <button style={{...s.btnOutline, color: 'var(--danger-text)', borderColor: 'var(--danger-text)'}} onClick={() => markAll('absent')}>
                Mark All Absent
              </button>
            </div>
            <div style={s.summaryPills}>
              <span style={s.pillGreen}>{presentCount} Present</span>
              <span style={s.pillRed}>{absentCount} Absent</span>
              <span style={s.pillNavy}>{students.length} Total</span>
            </div>
          </div>

          <div style={s.studentList}>
            {students.map(student => (
              <div key={student._id} style={{...s.studentCard, borderLeft: `5px solid ${student.status === 'present' ? 'var(--success-text)' : 'var(--danger-text)'}`}}>
                <div style={s.studentInfo}>
                  <div style={{...s.avatar, background: student.status === 'present' ? 'var(--success-text)' : 'var(--danger-text)'}}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p style={s.studentName}>{student.name}</p>
                    <p style={s.studentCode}>{student.satCode}</p>
                  </div>
                </div>
                
                <button 
                  style={student.status === "present" ? s.btnPresent : s.btnAbsent}
                  onClick={() => toggleStatus(student._id)}
                >
                  {student.status === "present" ? <><i className="fa-solid fa-check"></i> Present</> : <><i className="fa-solid fa-xmark"></i> Absent</>}
                </button>
              </div>
            ))}
          </div>

          <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Processing...</> : <><i className="fa-solid fa-cloud-arrow-up"></i> Save Attendance for {formatAttendanceDate(selectedDate)}</>}
          </button>
        </>
      )}

        </>
      )}

    </div>
  );
}

const s = {
  headerCard: { background: "var(--white)", borderRadius: "16px", padding: "28px", boxShadow: "var(--shadow-md)", marginBottom: "32px", border: "1px solid var(--border)" },
  controlsRow: { display: "flex", gap: "24px", marginBottom: "20px" },
  label: { display: "block", color: "var(--gold)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "900", marginBottom: "10px" },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '16px', color: 'var(--navy)', fontSize: '1.1rem', zIndex: 5 },
  inputWithIcon: { width: "100%", padding: "14px 14px 14px 48px", borderRadius: "12px", border: "2px solid var(--border)", fontFamily: "var(--font-body)", fontSize: "1rem", background: "var(--white)", boxSizing: "border-box", transition: "var(--transition)", cursor: 'pointer', fontWeight: '600' },
  datePickerInput: { padding: "12px 14px" },
  datePickerRow: { gridTemplateColumns: "1.2fr 0.9fr 0.8fr" },
  holidayWidget: {
    marginTop: "20px",
    padding: "18px 20px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, rgba(14,107,107,0.08), rgba(200,150,12,0.08))",
    border: "1px solid rgba(200,150,12,0.18)"
  },
  widgetHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "14px" },
  widgetEyebrow: { margin: 0, fontSize: "0.7rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)" },
  widgetTitle: { margin: "4px 0 0", fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1rem" },
  widgetIcon: { color: "var(--navy)", fontSize: "1.1rem" },
  widgetGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" },
  widgetStat: { background: "var(--white)", borderRadius: "12px", padding: "12px 14px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "4px" },
  widgetLabel: { fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" },
  widgetValue: { fontSize: "0.95rem", fontWeight: 900, color: "var(--navy)" },
  widgetMeta: { fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 },
  dateHint: { marginTop: "8px", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 },
  
  warningBanner: { background: "var(--light-bg)", border: "1px solid var(--border)", color: "var(--text)", padding: "14px 20px", borderRadius: "10px", fontSize: "0.9rem", marginTop: "16px" },
  markedDatesRow: { marginTop: "18px", paddingTop: "18px", borderTop: "1px dashed var(--border)" },
  markedDatesLabel: { display: "block", fontSize: "0.72rem", fontWeight: "900", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" },
  markedDatesList: { display: "flex", flexWrap: "wrap", gap: "10px" },
  markedDateBtn: { background: "var(--white)", border: "1px solid var(--border)", borderRadius: "999px", padding: "8px 14px", cursor: "pointer", color: "var(--navy)", fontWeight: "700", fontSize: "0.82rem" },
  markedDateActive: { background: "var(--navy)", border: "1px solid var(--navy)", borderRadius: "999px", padding: "8px 14px", cursor: "pointer", color: "var(--white)", fontWeight: "700", fontSize: "0.82rem" },
  markedDateMeta: { fontWeight: "600", opacity: 0.8 },
  
  bulkRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  bulkBtns: { display: "flex", gap: "12px" },
  btnOutline: { background: "var(--white)", border: "2px solid", padding: "10px 20px", borderRadius: "10px", fontWeight: "800", cursor: "pointer", transition: "var(--transition)", fontSize: "0.85rem" },
  
  summaryPills: { display: "flex", gap: "10px" },
  pillGreen: { background: "var(--success-bg)", color: "var(--success-text)", padding: "8px 16px", borderRadius: "30px", fontWeight: "800", fontSize: "0.8rem" },
  pillRed: { background: "var(--danger-bg)", color: "var(--danger-text)", padding: "8px 16px", borderRadius: "30px", fontWeight: "800", fontSize: "0.8rem" },
  pillNavy: { background: "var(--navy)", color: "var(--white)", padding: "8px 16px", borderRadius: "30px", fontWeight: "800", fontSize: "0.8rem" },

  studentList: { display: "flex", flexDirection: "column", gap: "14px", marginBottom: "40px" },
  studentCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--white)", borderRadius: "16px", padding: "18px 24px", transition: "var(--transition)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" },
  studentInfo: { display: "flex", alignItems: "center", gap: "18px" },
  avatar: { width: "46px", height: "46px", borderRadius: "50%", color: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.2rem" },
  studentName: { margin: 0, fontWeight: "800", color: "var(--navy)", fontSize: "1.05rem" },
  studentCode: { margin: 0, color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: "600" },

  btnPresent: { background: "var(--success-text)", color: "white", border: "none", padding: "10px 24px", borderRadius: "30px", fontWeight: "800", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  btnAbsent: { background: "var(--danger-text)", color: "white", border: "none", padding: "10px 24px", borderRadius: "30px", fontWeight: "800", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 4px 12px rgba(197,34,31,0.2)" },

  saveBtn: { width: "100%", background: "linear-gradient(135deg, var(--navy), var(--navy-dark))", color: "var(--white)", padding: "18px", borderRadius: "40px", fontWeight: "800", fontSize: "1.1rem", border: "none", cursor: "pointer", transition: "var(--transition)", boxShadow: "var(--shadow-lg)", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  loading: { padding: '50px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.1rem' },
  empty: { padding: '50px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--white)', borderRadius: '16px', border: '2px dashed var(--border)' }
};
