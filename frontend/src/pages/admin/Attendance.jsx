import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import SectionTitle from "../../components/SectionTitle";
import Table from "../../components/Table";

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
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [markedDates, setMarkedDates] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await api.get("/classes");
        setClasses(data);
        if (data.length > 0) setSelectedClass(data[0]._id);
      } catch (e) {
        console.error("Failed to fetch classes");
      }
    };
    fetchClasses();
  }, []);

  const fetchMarkedDates = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const { data } = await api.get(`/attendance/dates?classId=${selectedClass}`);
      setMarkedDates(data);
    } catch (e) {
      console.error("Failed to fetch attendance dates", e);
      setMarkedDates([]);
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchMarkedDates();
    setSelectedDate(getLocalDate());
  }, [fetchMarkedDates]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedClass || !selectedDate) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance?classId=${selectedClass}&date=${selectedDate}`);
      setStudents(data.students);
      setAlreadyMarked(data.alreadyMarked);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const absentStudents = students.filter(s => s.absent);
  const presentCount = alreadyMarked ? students.length - absentStudents.length : 0;
  const absentCount = alreadyMarked ? absentStudents.length : 0;
  const today = getLocalDate();
  const pastDateOptions = markedDates.filter(record => record.date !== today);

  return (
    <div>
      <SectionTitle 
        title="School Attendance Ledger" 
        subtitle="Monitor student presence. Data is only verified once teachers submit their logs." 
      />

      <div style={s.filterCard}>
        <div style={s.filterRow}>
          <div style={{flex: 1.5}}>
            <label style={s.label}>View Class & Section</label>
            <div style={s.inputWrap}>
              <i className="fa-solid fa-chalkboard-user" style={s.inputIcon}></i>
              <select style={s.inputWithIcon} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="" disabled>Select Class...</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>{c.name} - {c.section}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{flex: 1}}>
            <label style={s.label}>Select Ledger Date</label>
            <div style={s.inputWrap}>
              <i className="fa-solid fa-calendar-check" style={s.inputIcon}></i>
              <select style={s.inputWithIcon} value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
                <option value={today}>Today - Latest Attendance ({formatAttendanceDate(today)})</option>
                {pastDateOptions.map(record => (
                  <option key={record.date} value={record.date}>
                    {formatAttendanceDate(record.date)} - Attendance Visible ({record.absentCount} absent)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={s.statsSummary}>
           <div style={s.statItem}>
             <span style={s.statLabel}>Teacher Submission:</span>
             <span style={{...s.badge, background: alreadyMarked ? "var(--success-bg)" : "var(--gold-pale)", color: alreadyMarked ? "var(--success-text)" : "var(--navy)"}}>
               {alreadyMarked ? "✓ Records Verified" : "⚠ Awaiting Teacher Submission"}
             </span>
           </div>
           {alreadyMarked && (
             <div style={s.statItem}>
               <span style={s.statLabel}>Day Summary:</span>
               <span style={s.pillGreen}>{presentCount} Present</span>
               <span style={s.pillRed}>{absentCount} Absent</span>
             </div>
           )}
        </div>
      </div>

      {alreadyMarked && absentStudents.length > 0 && (
        <div style={s.absentBox}>
          <div style={s.absentHeader}>
            <i className="fa-solid fa-user-xmark"></i>
            <span>List of Absent Students ({absentStudents.length})</span>
          </div>
          <div style={s.absentGrid}>
            {absentStudents.map(st => (
              <div key={st._id} style={s.absentItem}>
                <div style={s.absentBullet}></div>
                <div>
                  <div style={s.absentName}>{st.name}</div>
                  <div style={s.absentCode}>{st.satCode}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Table
        loading={loading}
        headers={["Roll No / Code", "Student Name", "Presence Status", "Verification"]}
        data={students}
        renderRow={(st) => (
          <>
            <td style={stStyle.td}>{st.satCode}</td>
            <td style={stStyle.td}><strong>{st.name}</strong></td>
            <td style={stStyle.td}>
              {alreadyMarked ? (
                <span style={{ 
                  ...s.badge, 
                  background: !st.absent ? "var(--success-bg)" : "var(--danger-bg)", 
                  color: !st.absent ? "var(--success-text)" : "var(--danger-text)" 
                }}>
                  {!st.absent ? "Present" : "Absent"}
                </span>
              ) : (
                <span style={{...s.badge, background: 'var(--light-bg)', color: 'var(--text-muted)'}}>
                   Pending
                </span>
              )}
            </td>
            <td style={stStyle.td}>
              {alreadyMarked ? (
                <div style={{color: 'var(--success-text)', fontSize: '0.85rem', fontWeight: '700'}}>
                  <i className="fa-solid fa-circle-check"></i> Verified
                </div>
              ) : (
                <div style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>
                  Unverified
                </div>
              )}
            </td>
          </>
        )}
      />

      {students.length === 0 && !loading && (
        <div style={s.emptyState}>
          <i className="fa-solid fa-calendar-xmark" style={{fontSize: '2.5rem', marginBottom: '16px', color: 'var(--gold)'}}></i>
          <p style={{fontSize: '1.1rem', fontWeight: '600'}}>No students found.</p>
        </div>
      )}
    </div>
  );
}

const s = {
  filterCard: { background: "var(--white)", padding: "28px", borderRadius: "20px", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", marginBottom: "32px" },
  filterRow: { display: "flex", gap: "24px", marginBottom: "20px" },
  label: { display: "block", fontSize: "0.75rem", fontWeight: "900", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '16px', color: 'var(--navy)', fontSize: '1.1rem', zIndex: 5 },
  inputWithIcon: { width: "100%", padding: "14px 14px 14px 48px", borderRadius: "12px", border: "2px solid var(--border)", fontFamily: "var(--font-body)", fontSize: "1rem", background: "var(--white)", boxSizing: "border-box", fontWeight: '700' },
  
  statsSummary: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "20px", borderTop: "1px solid var(--border)" },
  statItem: { display: "flex", alignItems: "center", gap: "12px" },
  statLabel: { fontSize: "0.9rem", fontWeight: "800", color: "var(--text-muted)" },
  badge: { padding: "8px 16px", borderRadius: "30px", fontSize: "0.8rem", fontWeight: "800" },
  pillGreen: { background: "var(--success-bg)", color: "var(--success-text)", padding: "8px 16px", borderRadius: "30px", fontWeight: "800", fontSize: "0.8rem", marginLeft: "10px" },
  pillRed: { background: "var(--danger-bg)", color: "var(--danger-text)", padding: "8px 16px", borderRadius: "30px", fontWeight: "800", fontSize: "0.8rem", marginLeft: "10px" },

  absentBox: { background: "#fff5f5", border: "1.5px solid #feb2b2", borderRadius: "16px", padding: "24px", marginBottom: "32px", animation: "fadeInUp 0.4s ease-out" },
  absentHeader: { display: "flex", alignItems: "center", gap: "10px", color: "#c53030", fontWeight: "800", fontSize: "1.1rem", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" },
  absentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" },
  absentItem: { display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.7)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(197,48,48,0.1)" },
  absentBullet: { width: "8px", height: "8px", borderRadius: "50%", background: "#f56565" },
  absentName: { fontWeight: "700", color: "#2d3748", fontSize: "0.95rem" },
  absentCode: { fontSize: "0.75rem", color: "#718096", fontWeight: "600" },

  emptyState: { padding: "80px", textAlign: "center", background: "var(--white)", borderRadius: "20px", border: "2px dashed var(--border)" }
};

const stStyle = {
  td: { padding: "18px 20px", fontSize: "1rem", color: "var(--text)", borderBottom: "1px solid var(--border)" }
};
