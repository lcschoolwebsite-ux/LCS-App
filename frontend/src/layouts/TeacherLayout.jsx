import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import useActiveAcademicYear from "../hooks/useActiveAcademicYear";
import AppFooter from "../components/AppFooter";

// Lazy pages
const Dashboard = lazy(() => import("../pages/teacher/Dashboard"));
const Students = lazy(() => import("../pages/teacher/Students"));
const AddStudent = lazy(() => import("../pages/teacher/AddStudent"));
const Attendance = lazy(() => import("../pages/teacher/Attendance"));
const Marks = lazy(() => import("../pages/teacher/Marks"));
const Exams = lazy(() => import("../pages/teacher/Exams"));
const Announcements = lazy(() => import("../pages/teacher/Announcements"));
const Profile = lazy(() => import("../pages/teacher/Profile"));

const MENU_GROUPS = [
  {
    label: "HOME",
    items: [
      { label: "Dashboard", path: "/teacher", icon: "fa-solid fa-chart-line" },
      { label: "My Profile", path: "/teacher/profile", icon: "fa-solid fa-id-badge" },
      { label: "Announcements", path: "/teacher/announcements", icon: "fa-solid fa-bullhorn" },
    ]
  },
  {
    label: "MY CLASSES",
    items: [
      { label: "My Students", path: "/teacher/students", icon: "fa-solid fa-users" },
      { label: "Add Student", path: "/teacher/students/add", icon: "fa-solid fa-user-plus" },
      { label: "Attendance", path: "/teacher/attendance", icon: "fa-solid fa-clipboard-user" },
    ]
  },
  {
    label: "EVALUATION",
    items: [
      { label: "All Exams", path: "/teacher/exams", icon: "fa-solid fa-file-lines" },
      { label: "Marks Entry", path: "/teacher/marks", icon: "fa-solid fa-pen-to-square" },
    ]
  }
];

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [allowTeacherStudentCreation, setAllowTeacherStudentCreation] = useState(true);
  const { academicYearLabel } = useActiveAcademicYear();

  useEffect(() => {
    const fetchStudentRegistrationSettings = async () => {
      try {
        const { data } = await api.get("/settings/student-registration");
        setAllowTeacherStudentCreation(Boolean(data.allowTeacherStudentCreation));
      } catch (e) {
        console.error("Unable to load teacher permissions", e);
      }
    };

    fetchStudentRegistrationSettings();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const allMenuItems = MENU_GROUPS.flatMap(g => g.items);
  const currentPathLabel = allMenuItems.find(i => i.path === location.pathname)?.label || "Dashboard";

  return (
    <div style={s.container} className="teacher-shell">
      <div style={s.mobileTopbar} className="teacher-mobile-topbar">
        <div style={s.mobileBrand}>
          <img src="/logo.png" alt="Logo" style={s.mobileLogo} />
          <div>
            <h1 style={s.mobileSchoolName}>Loretto Central</h1>
            <p style={s.mobileUserLine}>{user?.name || "Teacher"} · Teacher Portal</p>
          </div>
        </div>
        <button onClick={handleLogout} style={s.mobileLogout} aria-label="Logout">
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>

      <nav style={s.mobileNav} className="teacher-mobile-nav" aria-label="Teacher navigation">
        {MENU_GROUPS.flatMap(group => group.items)
          .filter(item => allowTeacherStudentCreation || item.path !== "/teacher/students/add")
          .map(item => {
            const isActive = item.path === "/teacher" ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} style={{ ...s.mobileNavItem, ...(isActive ? s.activeMobileNavItem : {}) }}>
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      {/* Sidebar */}
      <aside style={s.sidebar} className="teacher-sidebar">
        <div style={s.logoArea}>
          <img src="/logo.png" alt="Logo" style={s.logoImg} />
          <div>
            <h1 style={s.schoolName}>Loretto Central</h1>
            <p style={s.tagline}>love through service</p>
          </div>
        </div>

        <div style={s.userInfoCard}>
          <div style={s.avatar}>{user?.name?.[0] || 'T'}</div>
          <div>
            <div style={s.userName}>{user?.name || 'Teacher'}</div>
            <div style={s.userRole}>TEACHER PORTAL</div>
          </div>
        </div>

        <nav style={s.nav} className="teacher-nav">
          {MENU_GROUPS.map((group, gIdx) => (
            <div key={gIdx} style={s.navGroup}>
              <div style={s.groupLabel}>{group.label}</div>
              {group.items.filter(item => allowTeacherStudentCreation || item.path !== "/teacher/students/add").map(item => {
                const isActive = item.path === "/teacher" ? location.pathname === item.path : location.pathname.startsWith(item.path);
                return (
                  <Link key={item.path} to={item.path} style={{...s.navItem, ...(isActive ? s.activeNav : {})}}>
                    <i className={item.icon} style={s.icon}></i>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <div style={s.yearBadge}>AY {academicYearLabel}</div>
          <button onClick={handleLogout} style={s.logoutBtn}>
            <i className="fa-solid fa-arrow-right-from-bracket" style={{marginRight: '8px'}}></i> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={s.main} className="teacher-main">
        {/* Top Header */}
        <header style={s.header} className="teacher-header">
          <div>
            <h2 style={s.pageTitle}>{currentPathLabel}</h2>
            <div style={s.breadcrumb}>Teacher Portal / {currentPathLabel}</div>
          </div>
          
          <div style={s.headerRight} className="teacher-header-right">
            <button style={s.bellBtn}>
              <i className="fa-regular fa-bell"></i>
            </button>
            <div style={s.headerYearPill}>{academicYearLabel}</div>
            <div style={s.headerAvatar}>{user?.name?.[0] || 'T'}</div>
          </div>
        </header>

        <section style={s.content} className="teacher-content">
          <Suspense fallback={<div style={s.loading}><i className="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/add" element={<AddStudent />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/marks" element={<Marks />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<div style={s.loading}>Page coming soon...</div>} />
            </Routes>
          </Suspense>
        </section>
        <AppFooter />
      </main>
    </div>
  );
}

const s = {
  container: { display: "flex", width: "100%", minHeight: "100vh", background: "var(--light-bg)" },
  
  /* Sidebar Styles */
  sidebar: { width: "240px", background: "linear-gradient(180deg, #051a1a 0%, #094f4f 100%)", borderRight: "1px solid rgba(200,150,12,0.2)", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, zIndex: 100 },
  logoArea: { display: "flex", alignItems: "center", gap: "12px", padding: "20px" },
  logoImg: { width: "50px", height: "50px", objectFit: "contain" },
  schoolName: { fontFamily: "var(--font-heading)", color: "var(--white)", fontSize: "1.1rem", margin: 0, lineHeight: 1.2 },
  tagline: { color: "var(--gold-light)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: "4px 0 0 0" },

  mobileTopbar: { display: "none" },
  mobileBrand: { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 },
  mobileLogo: { width: "42px", height: "42px", objectFit: "contain", flex: "0 0 auto" },
  mobileSchoolName: { fontFamily: "var(--font-heading)", color: "var(--white)", fontSize: "1rem", lineHeight: 1.1, margin: 0 },
  mobileUserLine: { color: "var(--gold-light)", fontSize: "0.72rem", fontWeight: "800", margin: "3px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "240px" },
  mobileLogout: { width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "var(--gold-light)", border: "1px solid rgba(200,150,12,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" },
  mobileNav: { display: "none" },
  mobileNavItem: { display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", borderRadius: "999px", color: "rgba(255,255,255,0.72)", fontSize: "0.78rem", fontWeight: "800", whiteSpace: "nowrap", flex: "0 0 auto", border: "1px solid rgba(255,255,255,0.08)" },
  activeMobileNavItem: { background: "var(--gold)", color: "var(--navy-dark)", border: "1px solid var(--gold)", boxShadow: "0 6px 16px rgba(0,0,0,0.2)" },
  
  userInfoCard: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(200,150,12,0.2)", borderRadius: "12px", padding: "12px", margin: "0 20px 20px 20px", display: "flex", alignItems: "center", gap: "12px" },
  avatar: { width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.1rem" },
  userName: { color: "var(--white)", fontSize: "0.85rem", fontFamily: "var(--font-body)", fontWeight: "700" },
  userRole: { color: "var(--gold-pale)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px", fontWeight: "600" },
  
  nav: { flex: 1, overflowY: "auto", padding: "0 16px" },
  navGroup: { marginBottom: "20px" },
  groupLabel: { color: "var(--gold)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.7, marginBottom: "8px", paddingLeft: "12px", fontWeight: "700" },
  navItem: { display: "flex", alignItems: "center", padding: "10px 12px", borderRadius: "10px", color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: "0.88rem", fontWeight: "600", transition: "var(--transition)", marginBottom: "4px" },
  activeNav: { background: "linear-gradient(135deg, var(--navy), var(--navy-dark))", color: "var(--white)", boxShadow: "0 4px 14px rgba(14,107,107,0.4)", borderLeft: "3px solid var(--gold-light)" },
  icon: { width: "20px", textAlign: "center", marginRight: "10px", fontSize: "1rem" },
  
  sidebarBottom: { padding: "20px", borderTop: "1px solid rgba(255,255,255,0.05)" },
  yearBadge: { border: "1px solid var(--gold)", color: "var(--gold)", borderRadius: "20px", padding: "4px 12px", fontSize: "0.7rem", fontWeight: "700", textAlign: "center", marginBottom: "16px", background: "rgba(200,150,12,0.1)" },
  logoutBtn: { width: "100%", padding: "10px", background: "transparent", border: "1px solid transparent", color: "rgba(255,255,255,0.6)", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "var(--transition)", fontSize: "0.85rem" },

  /* Header Styles */
  main: { flex: 1, marginLeft: "240px", display: "flex", flexDirection: "column", minWidth: 0 },
  header: { height: "64px", background: "var(--white)", borderBottom: "3px solid var(--gold)", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", padding: "0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 90 },
  pageTitle: { fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.3rem", margin: 0, fontWeight: "700" },
  breadcrumb: { color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "2px" },
  
  headerRight: { display: "flex", alignItems: "center", gap: "20px" },
  bellBtn: { background: "none", border: "none", fontSize: "1.2rem", color: "var(--navy)", position: "relative", cursor: "pointer" },
  headerYearPill: { background: "var(--navy)", color: "var(--gold)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "800" },
  headerAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", cursor: "pointer", fontSize: "0.9rem" },

  content: { padding: "32px", flex: 1 },
  loading: { padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "1.2rem" }
};
