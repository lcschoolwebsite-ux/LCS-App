import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";
import StatCard from "../../components/StatCard";
import SectionTitle from "../../components/SectionTitle";
import useActiveAcademicYear from "../../hooks/useActiveAcademicYear";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { academicYearLabel } = useActiveAcademicYear();
  const [stats, setStats] = useState({
    students: 0, teachers: 0, classes: 0, fees: 0, pendingFees: 0,
    studentsByClass: [], todayAttendance: { present: 0, absent: 0, unmarked: 0, unmarkedClasses: [] }, recentActivity: [], upcomingExams: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/dashboard/admin-stats");
        setStats(data);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      }
    };
    fetchStats();
  }, []);

  const COLORS = ["#10b981", "#ef4444"];

  return (
    <div style={s.page}>
      {/* Welcome Hero Banner */}
      <div style={s.heroBanner}>
        <div>
          <h1 style={s.heroTitle}>Welcome back, Administrator 👋</h1>
          <p style={s.heroSub}>Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • AY {academicYearLabel}</p>
        </div>
        <div style={s.heroActions}>
          <button style={s.heroBtn} onClick={() => navigate("/admin/students?action=add")}>
            <i className="fa-solid fa-user-plus"></i> Add Student
          </button>
          <button style={s.heroBtn} onClick={() => navigate("/admin/attendance")}>
            <i className="fa-solid fa-clipboard-user"></i> Mark Attendance
          </button>
          <button style={s.heroBtn} onClick={() => navigate("/admin/exams?action=create")}>
            <i className="fa-solid fa-file-pen"></i> Create Exam
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div style={s.grid4}>
        <StatCard title="Total Students" value={stats.students} icon={<i className="fa-solid fa-user-graduate"></i>} color="navy" trend="+12%" />
        <StatCard title="Total Teachers" value={stats.teachers} icon={<i className="fa-solid fa-chalkboard-user"></i>} color="gold" trend="+2%" />
        <StatCard title="Fees Collected" value={`₹${(stats.fees/100000).toFixed(1)}L`} icon={<i className="fa-solid fa-sack-dollar"></i>} color="teal" trend="+5%" />
        <StatCard title="Fees Pending" value={`₹${(stats.pendingFees/100000).toFixed(1)}L`} icon={<i className="fa-solid fa-hourglass-half"></i>} color="red" trend="-2%" />
      </div>

      <div style={s.grid2}>
        {/* Left Col: Chart */}
        <div style={s.card}>
          <SectionTitle title="Students by Class" />
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer>
              <BarChart data={stats.studentsByClass} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{fontFamily: 'var(--font-body)', fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontFamily: 'var(--font-body)', fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: 'rgba(200,150,12,0.1)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)'}} />
                <Bar dataKey="count" fill="var(--navy)" radius={[4,4,0,0]} activeBar={{fill: 'var(--gold)'}} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Attendance Donut */}
        <div style={s.card}>
          <SectionTitle title="Today's Attendance" />
          <div style={{ height: "200px", width: "100%" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{name:"Present", value:stats.todayAttendance.present}, {name:"Absent", value:stats.todayAttendance.absent}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={s.attnSummary}>
            <p><strong>{stats.classes - (stats.todayAttendance.unmarkedClasses?.length || 0)}</strong> classes marked today / {stats.classes} total</p>
            {stats.todayAttendance.unmarkedClasses?.length > 0 && (
              <div style={s.unmarkedBox}>
                <p style={{margin:0, fontSize: '0.85rem', color: 'var(--danger-text)'}}>Unmarked: {stats.todayAttendance.unmarkedClasses.join(", ")}</p>
                <button style={s.smallGoldBtn} onClick={() => navigate("/admin/attendance")}>Mark Now</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={s.grid2}>
        {/* Recent Activity */}
        <div style={s.card}>
          <SectionTitle title="Recent Activity" />
          <div style={s.activityList}>
            {stats.recentActivity.map(act => (
              <div key={act.id} style={s.activityItem}>
                <div style={s.actDot}></div>
                <div style={s.actIcon}>
                  {act.type === 'fee' ? '💰' : act.type === 'attendance' ? '📋' : '📝'}
                </div>
                <div>
                  <p style={s.actMsg}>{act.msg}</p>
                  <p style={s.actTime}>{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div style={s.card}>
          <SectionTitle title="Upcoming Exams" />
          <div style={s.examScroll}>
            {stats.upcomingExams.map(exam => (
              <div key={exam.id} style={s.examCard}>
                <div style={s.examTopBar}></div>
                <h4 style={s.examTitle}>{exam.title}</h4>
                <div style={s.examTags}>
                  <span style={s.examTag}>{exam.class}</span>
                  <span style={s.examTag}>{exam.date}</span>
                </div>
                <button style={s.examBtn} onClick={() => navigate("/admin/exams")}>View Details</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { width: "100%" },
  heroBanner: {
    background: "linear-gradient(135deg, var(--navy-dark), var(--navy))",
    padding: "32px 36px",
    borderRadius: "16px",
    marginBottom: "28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "var(--shadow-md)"
  },
  heroTitle: { fontFamily: "var(--font-heading)", color: "var(--white)", fontSize: "1.6rem", margin: "0 0 8px 0" },
  heroSub: { color: "var(--gold-light)", fontSize: "0.85rem", margin: 0, fontWeight: "600" },
  heroActions: { display: "flex", gap: "12px" },
  heroBtn: { background: "var(--gold)", color: "var(--navy-dark)", borderRadius: "50px", padding: "10px 20px", fontWeight: "700", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)", transition: "var(--transition)", animation: "shimmer 3s linear infinite" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "28px" },
  grid2: { display: "grid", gridTemplateColumns: "60% calc(40% - 24px)", gap: "24px", marginBottom: "28px" },
  card: { background: "var(--white)", borderRadius: "16px", padding: "28px", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" },
  
  attnSummary: { textAlign: "center", marginTop: "16px" },
  unmarkedBox: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--danger-bg)", padding: "12px 16px", borderRadius: "8px", marginTop: "12px" },
  smallGoldBtn: { background: "var(--gold)", color: "var(--navy-dark)", padding: "6px 12px", borderRadius: "6px", fontWeight: "700", fontSize: "0.75rem" },

  activityList: { display: "flex", flexDirection: "column", gap: "20px" },
  activityItem: { display: "flex", alignItems: "center", gap: "16px", position: "relative" },
  actDot: { width: "10px", height: "10px", background: "var(--gold)", borderRadius: "50%", position: "absolute", left: "-20px" },
  actIcon: { width: "40px", height: "40px", borderRadius: "10px", background: "rgba(14,107,107,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" },
  actMsg: { margin: 0, fontWeight: "600", color: "var(--text)", fontSize: "0.95rem" },
  actTime: { margin: "4px 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" },

  examScroll: { display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "12px" },
  examCard: { minWidth: "220px", background: "var(--light-bg)", borderRadius: "12px", padding: "20px", position: "relative", overflow: "hidden", border: "1px solid var(--border)" },
  examTopBar: { position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: "linear-gradient(90deg, var(--navy), var(--gold))" },
  examTitle: { fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.2rem", margin: "0 0 12px 0" },
  examTags: { display: "flex", gap: "8px", marginBottom: "16px" },
  examTag: { background: "rgba(200,150,12,0.15)", color: "var(--gold)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" },
  examBtn: { width: "100%", background: "var(--white)", border: "1px solid var(--navy)", color: "var(--navy)", padding: "8px", borderRadius: "6px", fontWeight: "700", fontSize: "0.8rem", transition: "var(--transition)" }
};
