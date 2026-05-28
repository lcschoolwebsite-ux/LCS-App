import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";
import StatCard from "../../components/StatCard";
import SectionTitle from "../../components/SectionTitle";

const formatClassName = cls => [cls?.name, cls?.section].filter(Boolean).join(" ") || "Class";
const getLocalDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split("T")[0];
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [stats, setStats] = useState({
    myStudents: 0, attendanceMarked: false, pendingMarks: 0, announcements: 0,
    classes: [], quickAttendance: [], selectedClassId: ""
  });

  useEffect(() => {
    const assignedClasses = user?.assignedClasses || [];
    const firstClassId = assignedClasses[0]?._id || "";

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [studentResponses, examsRes, announcementsRes, attendanceRes] = await Promise.all([
          Promise.all(assignedClasses.map(cls => api.get(`/students?classId=${cls._id}`))),
          api.get("/exams"),
          api.get("/announcements"),
          firstClassId ? api.get(`/attendance?classId=${firstClassId}&date=${getLocalDate()}`) : Promise.resolve({ data: { students: [], alreadyMarked: false } })
        ]);

        const exams = examsRes.data || [];
        const classCards = assignedClasses.map((cls, index) => {
          const students = studentResponses[index]?.data || [];
          const classExams = exams.filter(exam => exam.class?._id === cls._id);
          return {
            id: cls._id,
            name: formatClassName(cls),
            students: students.length,
            examCount: classExams.length,
            firstExamId: classExams[0]?._id || ""
          };
        });

        const quickAttendance = (attendanceRes.data.students || []).map(student => ({
          id: student._id,
          name: student.name,
          code: student.satCode,
          status: student.absent ? "absent" : "present"
        }));

        setStats({
          myStudents: studentResponses.reduce((sum, res) => sum + (res.data?.length || 0), 0),
          attendanceMarked: Boolean(attendanceRes.data.alreadyMarked),
          pendingMarks: exams.length,
          announcements: announcementsRes.data?.length || 0,
          classes: classCards,
          quickAttendance,
          selectedClassId: firstClassId
        });
      } catch (e) {
        console.error("Failed to load teacher dashboard", e);
      } finally {
        setLoading(false);
      }
    };

    if (assignedClasses.length) loadDashboard();
    else {
      setStats(prev => ({ ...prev, classes: [], quickAttendance: [], selectedClassId: "" }));
      setLoading(false);
    }
  }, [user]);

  const toggleStatus = (id) => {
    setStats(prev => ({
      ...prev,
      quickAttendance: prev.quickAttendance.map(s => 
        s.id === id ? { ...s, status: s.status === "present" ? "absent" : "present" } : s
      )
    }));
  };

  const absentCount = stats.quickAttendance.filter(s => s.status === 'absent').length;
  const presentCount = stats.quickAttendance.filter(s => s.status === 'present').length;
  const selectedClass = stats.classes.find(cls => cls.id === stats.selectedClassId);

  const goToStudents = classId => navigate(`/teacher/students${classId ? `?classId=${classId}` : ""}`);
  const goToAttendance = classId => navigate(`/teacher/attendance${classId ? `?classId=${classId}` : ""}`);
  const goToMarks = examId => navigate(`/teacher/marks${examId ? `?examId=${examId}` : ""}`);
  const goToExams = classId => navigate(`/teacher/exams${classId ? `?classId=${classId}` : ""}`);

  const handleQuickClassChange = async (classId) => {
    setAttendanceMessage("");
    setAttendanceLoading(true);
    setStats(prev => ({ ...prev, selectedClassId: classId, quickAttendance: [] }));
    if (!classId) {
      setAttendanceLoading(false);
      return;
    }

    try {
      const { data } = await api.get(`/attendance?classId=${classId}&date=${getLocalDate()}`);
      setStats(prev => ({
        ...prev,
        attendanceMarked: Boolean(data.alreadyMarked),
        quickAttendance: (data.students || []).map(student => ({
          id: student._id,
          name: student.name,
          code: student.satCode,
          status: student.absent ? "absent" : "present"
        }))
      }));
    } catch (e) {
      console.error("Failed to load quick attendance", e);
      setAttendanceMessage(e.response?.data?.message || "Could not load attendance for this class.");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const saveQuickAttendance = async () => {
    if (!stats.selectedClassId) return;

    setAttendanceSaving(true);
    setAttendanceMessage("");
    try {
      await api.post("/attendance", {
        classId: stats.selectedClassId,
        date: getLocalDate(),
        absentIds: stats.quickAttendance.filter(student => student.status === "absent").map(student => student.id)
      });
      setStats(prev => ({ ...prev, attendanceMarked: true }));
      setAttendanceMessage("Attendance saved for today.");
    } catch (e) {
      console.error("Failed to save quick attendance", e);
      setAttendanceMessage(e.response?.data?.message || "Could not save attendance.");
    } finally {
      setAttendanceSaving(false);
    }
  };

  return (
    <div style={s.page} className="teacher-dashboard">
      {/* Welcome Hero Banner */}
        <div style={s.heroBanner} className="teacher-hero-banner">
        <div>
          <h1 style={s.heroTitle}>Welcome back, Teacher {user?.name?.split(' ')[0] || ""}</h1>
          <p style={s.heroSub}>Manage your classes and student progress.</p>
        </div>
      </div>

      {loading && <div style={s.loading}>Loading your teacher dashboard...</div>}

      {/* 4 Stat Cards */}
      <div style={s.grid4} className="teacher-dashboard-grid">
        <StatCard title="My Students" value={stats.myStudents} icon={<i className="fa-solid fa-users"></i>} color="navy" />
        <StatCard title="Today's Attendance" value={stats.attendanceMarked ? "Marked" : "Pending"} icon={<i className="fa-solid fa-clipboard-user"></i>} color={stats.attendanceMarked ? "teal" : "gold"} trend={stats.attendanceMarked ? "Done" : "Action Required"} trendLabel="" />
        <StatCard title="Active Exams" value={stats.pendingMarks} icon={<i className="fa-solid fa-pen-to-square"></i>} color="red" />
        <StatCard title="Announcements" value={stats.announcements} icon={<i className="fa-solid fa-bullhorn"></i>} color="navy" />
      </div>

      <div style={s.grid2} className="teacher-quick-grid">
        {/* My Classes Panel */}
        <div style={s.card}>
          <SectionTitle title="My Classes" />
          <div style={s.classList} className="teacher-class-list">
            {stats.classes.length === 0 && (
              <div style={s.empty}>No classes are assigned yet. Ask the admin to assign classes to your teacher profile.</div>
            )}
            {stats.classes.map(cls => (
              <div key={cls.id} style={s.classCard} className="teacher-class-card">
                <div style={s.classGradientTop}></div>
                <h3 style={s.className}>{cls.name}</h3>
                <p style={s.classSub}>{cls.students} Students</p>
                
                <div style={s.progressWrap}>
                  <div style={s.progressLabels}>
                    <span>Scheduled Exams</span>
                    <span>{cls.examCount}</span>
                  </div>
                  <div style={s.progressBar}>
                    <div style={{...s.progressFill, width: `${Math.min(cls.examCount * 20, 100)}%`, background: cls.examCount ? 'var(--gold)' : 'var(--border)'}}></div>
                  </div>
                </div>

                <div style={s.classActions} className="teacher-class-actions">
                  <button style={s.btnGold} onClick={() => goToAttendance(cls.id)}>Mark Attendance</button>
                  <button style={s.btnOutline} onClick={() => cls.firstExamId ? goToMarks(cls.firstExamId) : goToExams(cls.id)}>
                    {cls.firstExamId ? "Enter Marks" : "Schedule Exam"}
                  </button>
                  <button style={s.btnOutline} onClick={() => goToStudents(cls.id)}>View Students</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Attendance Panel */}
        <div style={s.card} className="teacher-attendance-card">
          <SectionTitle title="Quick Attendance" subtitle={stats.attendanceMarked ? "Today's record already exists. Saving will update it." : "Mark absentees for today and save directly."} />
          
          <div style={s.attendanceHeader} className="teacher-attendance-header">
            <select style={s.select} value={stats.selectedClassId} onChange={e => handleQuickClassChange(e.target.value)}>
              {stats.classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
            <div style={s.datePill}>{new Date().toLocaleDateString('en-GB')}</div>
          </div>

          <div style={s.studentList} className="teacher-attendance-list">
            {attendanceLoading && (
              <div style={s.empty}>Loading students...</div>
            )}
            {stats.quickAttendance.length === 0 && (
              <div style={s.empty}>{selectedClass ? "No students found in this class." : "Select an assigned class to start attendance."}</div>
            )}
            {stats.quickAttendance.map(student => (
              <div key={student.id} style={s.studentRow}>
                <div style={s.studentInfo}>
                  <div style={s.studentAvatar}>{student.name.charAt(0)}</div>
                  <div>
                    <p style={s.studentName}>{student.name}</p>
                    <p style={s.studentCode}>{student.code}</p>
                  </div>
                </div>
                <button 
                  style={student.status === "present" ? s.btnPresent : s.btnAbsent}
                  onClick={() => toggleStatus(student.id)}
                >
                  {student.status === "present" ? <><i className="fa-solid fa-check"></i> Present</> : <><i className="fa-solid fa-xmark"></i> Absent</>}
                </button>
              </div>
            ))}
          </div>

          <div style={s.attendanceFooter} className="teacher-attendance-footer">
            <div style={s.attnSummary}>
              <span style={{color: 'var(--danger-text)'}}><strong>{absentCount}</strong> Absent</span> • <span style={{color: 'var(--success-text)'}}><strong>{presentCount}</strong> Present</span>
            </div>
            <div style={s.attendanceActions} className="teacher-attendance-actions">
              <button style={s.btnGhost} onClick={() => goToAttendance(stats.selectedClassId)}>Open Full Page</button>
              <button style={s.btnSave} onClick={saveQuickAttendance} disabled={attendanceSaving || !stats.selectedClassId || stats.quickAttendance.length === 0}>
                {attendanceSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          {attendanceMessage && <div style={s.inlineMessage}>{attendanceMessage}</div>}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { width: "100%" },
  loading: { background: "var(--white)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", color: "var(--text-muted)", fontWeight: "700" },
  heroBanner: { background: "linear-gradient(135deg, #094f4f, #0e6b6b)", padding: "32px 36px", borderRadius: "16px", marginBottom: "28px", color: "white", boxShadow: "var(--shadow-md)" },
  heroTitle: { fontFamily: "var(--font-heading)", fontSize: "1.6rem", margin: "0 0 8px 0", color: "white" },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", margin: 0 },
  
  grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "28px" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginBottom: "28px" },
  card: { background: "var(--white)", borderRadius: "16px", padding: "28px", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)", display: "flex", flexDirection: "column" },
  empty: { padding: "18px", background: "var(--light-bg)", border: "1px dashed var(--border)", borderRadius: "10px", color: "var(--text-muted)", fontWeight: "700", textAlign: "center" },
  
  classList: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" },
  classCard: { background: "var(--light-bg)", borderRadius: "12px", padding: "20px", position: "relative", overflow: "hidden", border: "1px solid var(--border)" },
  classGradientTop: { position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: "linear-gradient(90deg, var(--navy), var(--navy-dark))" },
  className: { fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.3rem", margin: "0 0 4px 0" },
  classSub: { color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 16px 0" },
  
  progressWrap: { marginBottom: "20px" },
  progressLabels: { display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" },
  progressBar: { width: "100%", height: "6px", background: "rgba(0,0,0,0.05)", borderRadius: "3px", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "3px", transition: "width 0.5s ease" },

  classActions: { display: "flex", flexDirection: "column", gap: "8px" },
  btnGold: { background: "var(--gold)", color: "var(--navy-dark)", padding: "8px", borderRadius: "6px", fontWeight: "700", fontSize: "0.8rem", width: "100%" },
  btnOutline: { background: "transparent", border: "1px solid var(--navy)", color: "var(--navy)", padding: "8px", borderRadius: "6px", fontWeight: "700", fontSize: "0.8rem", width: "100%" },

  attendanceHeader: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  select: { padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border)", fontFamily: "var(--font-body)", fontWeight: "600", color: "var(--navy)" },
  datePill: { background: "var(--navy)", color: "var(--gold)", padding: "8px 16px", borderRadius: "20px", fontWeight: "800", fontSize: "0.85rem" },

  studentList: { display: "flex", flexDirection: "column", gap: "12px", flex: 1, overflowY: "auto", maxHeight: "360px", paddingRight: "8px" },
  studentRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "12px", transition: "var(--transition)" },
  studentInfo: { display: "flex", alignItems: "center", gap: "12px" },
  studentAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "var(--navy)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" },
  studentName: { margin: 0, fontWeight: "700", color: "var(--text)", fontSize: "0.95rem" },
  studentCode: { margin: 0, color: "var(--text-muted)", fontSize: "0.75rem" },
  
  btnPresent: { background: "var(--success-text)", color: "white", border: "none", padding: "6px 16px", borderRadius: "20px", fontWeight: "700", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "6px" },
  btnAbsent: { background: "var(--danger-text)", color: "white", border: "none", padding: "6px 16px", borderRadius: "20px", fontWeight: "700", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "6px" },

  attendanceFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)" },
  attnSummary: { fontSize: "0.85rem", background: "var(--light-bg)", padding: "8px 16px", borderRadius: "20px" },
  attendanceActions: { display: "flex", alignItems: "center", gap: "10px" },
  btnGhost: { background: "var(--white)", color: "var(--navy)", border: "1px solid var(--navy)", padding: "10px 16px", borderRadius: "30px", fontWeight: "700", fontSize: "0.82rem" },
  btnSave: { background: "linear-gradient(135deg, var(--navy), var(--navy-dark))", color: "white", padding: "10px 24px", borderRadius: "30px", fontWeight: "700", fontSize: "0.9rem", boxShadow: "var(--shadow-md)", border: "none" },
  inlineMessage: { marginTop: "14px", background: "var(--light-bg)", border: "1px solid var(--border)", color: "var(--navy)", padding: "10px 14px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: "700" }
};
