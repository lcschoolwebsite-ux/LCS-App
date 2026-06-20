import { useMemo, useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import SectionTitle from "../../components/SectionTitle";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getWeekStart = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

export default function Attendance() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [yearlyStats, setYearlyStats] = useState({ totalWorkingDays: 0, present: 0, absent: 0 });
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [loading, setLoading] = useState(true);

  const selectedWeekStart = useMemo(() => getWeekStart(parseDate(selectedDate)), [selectedDate]);
  const selectedWeek = useMemo(
    () => Array.from({ length: 7 }, (_, index) => {
      const date = addDays(selectedWeekStart, index);
      return {
        date,
        dateKey: formatDate(date)
      };
    }),
    [selectedWeekStart]
  );

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const studentId = user?._id || user?.id;
        if (!studentId) {
          setReport({ log: [] });
          setYearlyStats({ totalWorkingDays: 0, present: 0, absent: 0 });
          return;
        }
        
        // Fetch yearly stats by aggregating data from academic year start to current month
        const academicYearStart = user?.academicYear?.startDate;
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        
        // Determine which months to fetch based on academic year
        let startMonth = 6; // Default June start
        let startYear = currentYear;
        
        if (academicYearStart) {
          const academicStartDate = new Date(academicYearStart);
          startMonth = academicStartDate.getMonth() + 1;
          startYear = academicStartDate.getFullYear();
        }
        
        // Build array of months to fetch
        const monthsToFetch = [];
        let iterYear = startYear;
        let iterMonth = startMonth;
        
        while (iterYear < currentYear || (iterYear === currentYear && iterMonth <= currentMonth)) {
          monthsToFetch.push({ year: iterYear, month: iterMonth });
          iterMonth++;
          if (iterMonth > 12) {
            iterMonth = 1;
            iterYear++;
          }
        }
        
        // Fetch attendance for all relevant months
        const monthlyPromises = monthsToFetch.map(({ year, month }) =>
          api.get(`/attendance/student-report?studentId=${studentId}&month=${month}&year=${year}`)
            .catch(() => ({ data: { total: 0, present: 0, absent: 0 } }))
        );
        
        const monthlyResponses = await Promise.all(monthlyPromises);
        const yearlyTotals = monthlyResponses.reduce(
          (acc, response) => ({
            totalWorkingDays: acc.totalWorkingDays + (response.data.total || 0),
            present: acc.present + (response.data.present || 0),
            absent: acc.absent + (response.data.absent || 0)
          }),
          { totalWorkingDays: 0, present: 0, absent: 0 }
        );
        setYearlyStats(yearlyTotals);
        
        // Fetch weekly data (for the table view)
        const monthKeys = Array.from(new Set(
          selectedWeek.map(({ date }) => `${date.getFullYear()}-${date.getMonth() + 1}`)
        ));

        const responses = await Promise.all(monthKeys.map(key => {
          const [year, month] = key.split("-");
          return api.get(`/attendance/student-report?studentId=${studentId}&month=${month}&year=${year}`);
        }));

        const log = responses.flatMap(({ data }) => data.log || []);
        setReport({ log });
      } catch (e) {
        console.error(e);
        setReport({ log: [] });
        setYearlyStats({ totalWorkingDays: 0, present: 0, absent: 0 });
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchReport();
  }, [user, selectedWeek]);

  const attendanceByDate = useMemo(() => {
    const map = new Map();
    report?.log?.forEach(entry => map.set(entry.date, entry));
    return map;
  }, [report]);

  const weeklyRows = useMemo(
    () => selectedWeek.map(({ date, dateKey }) => ({
      date,
      dateKey,
      status: attendanceByDate.get(dateKey)?.status || "Not Marked"
    })),
    [attendanceByDate, selectedWeek]
  );

  const weekLabel = `${selectedWeek[0].date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${selectedWeek[6].date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  const changeWeek = (direction) => {
    setSelectedDate(formatDate(addDays(selectedWeekStart, direction * 7)));
  };

  if (loading) return <div style={s.loading}><i className="fa-solid fa-circle-notch fa-spin"></i> Loading report...</div>;

  return (
    <div>
      <SectionTitle 
        title="My Attendance" 
        subtitle="Track your attendance for the complete academic year." 
      />
      
      <div style={s.statsGrid} className="student-attendance-stats">
        <StatBox label="Total Working Days" value={yearlyStats.totalWorkingDays} color="var(--navy)" icon="fa-solid fa-calendar-days" />
        <StatBox label="Days Present" value={yearlyStats.present} color="var(--success-text)" icon="fa-solid fa-user-check" />
        <StatBox label="Days Absent" value={yearlyStats.absent} color="var(--danger-text)" icon="fa-solid fa-user-xmark" />
      </div>

      <div style={s.card} className="student-table-card">
        <div style={s.cardHeader} className="student-attendance-card-header">
          <div>
            <h3 style={s.cardTitle}>Weekly Attendance</h3>
            <p style={s.weekSub}>Showing {weekLabel}</p>
          </div>
          <div style={s.weekControls} className="student-attendance-week-controls">
            <button type="button" style={s.arrowBtn} onClick={() => changeWeek(-1)} aria-label="Previous week">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={s.dateSearch}
              aria-label="Search attendance by date"
            />
            <button type="button" style={s.arrowBtn} onClick={() => changeWeek(1)} aria-label="Next week">
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div style={s.tableWrap} className="student-table-wrap">
          <table style={s.table} className="student-week-attendance-table">
            <thead>
              <tr>
                <th style={s.th}>Date</th>
                <th style={s.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {weeklyRows.map((entry) => (
                <tr key={entry.dateKey} style={s.tr}>
                  <td style={s.td}>
                    <div style={s.dateBox}>
                      <div style={s.dateNum}>{entry.dateKey.split('-')[2]}</div>
                      <div>
                          <div style={s.dateFull}>{entry.date.toLocaleDateString(undefined, { weekday: 'long' })}</div>
                          <div style={s.dateMeta}>{entry.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{ 
                      ...s.badge, 
                      ...(entry.status === "Present" ? s.badgePresent : entry.status === "Absent" ? s.badgeAbsent : s.badgeUnmarked)
                    }}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color, icon }) {
  return (
    <div style={{ ...s.statBox, borderTop: `4px solid ${color}` }}>
      <div style={s.statHeader}>
        <div style={s.statLabel}>{label}</div>
        <i className={icon} style={{ color, opacity: 0.6 }}></i>
      </div>
      <div style={{ ...s.statValue, color }}>{value}</div>
    </div>
  );
}

const s = {
  loading: { padding: '60px', textAlign: 'center', color: 'var(--text-muted)' },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "32px" },
  statBox: { background: "var(--white)", padding: "20px", borderRadius: "16px", boxShadow: "var(--shadow-sm)", transition: "var(--transition)" },
  statHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  statLabel: { fontSize: "0.7rem", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" },
  statValue: { fontSize: "1.8rem", fontWeight: "800", fontFamily: "var(--font-heading)" },
  
  card: { background: "var(--white)", borderRadius: "20px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-md)" },
  cardHeader: { padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--light-bg)" },
  cardTitle: { margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--navy)", fontFamily: "var(--font-heading)" },
  weekSub: { margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: "700" },
  weekControls: { display: "flex", alignItems: "center", gap: "10px" },
  arrowBtn: { width: "36px", height: "36px", borderRadius: "50%", background: "var(--navy)", color: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" },
  dateSearch: { height: "36px", border: "1.5px solid var(--border)", borderRadius: "20px", color: "var(--navy)", fontWeight: "800", padding: "0 12px", background: "var(--white)" },
  
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "16px 24px", textAlign: "left", background: "var(--white)", fontSize: "0.65rem", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: "800", borderBottom: "2px solid var(--border)" },
  tr: { borderBottom: "1px solid var(--border)", transition: "var(--transition)" },
  td: { padding: "16px 24px", fontSize: "0.95rem" },
  
  dateBox: { display: "flex", alignItems: "center", gap: "12px" },
  dateNum: { width: "32px", height: "32px", background: "var(--light-bg)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "var(--navy)" },
  dateFull: { fontSize: "0.85rem", color: "var(--text)", fontWeight: "600" },
  dateMeta: { fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" },
  
  badge: { padding: "6px 14px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "800" },
  badgePresent: { background: "var(--success-bg)", color: "var(--success-text)" },
  badgeAbsent: { background: "var(--danger-bg)", color: "var(--danger-text)" },
  badgeUnmarked: { background: "var(--light-bg)", color: "var(--text-muted)", border: "1px solid var(--border)" },
  empty: { padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.95rem" }
};
