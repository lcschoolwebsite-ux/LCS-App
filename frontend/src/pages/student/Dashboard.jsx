import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import SectionTitle from "../../components/SectionTitle";
import useActiveAcademicYear from "../../hooks/useActiveAcademicYear";
import { isNativeAndroidApp, registerNativePushForUser } from "../../services/nativeBridge";

const getMonthParts = () => {
  const today = new Date();
  return {
    month: today.getMonth() + 1,
    year: today.getFullYear()
  };
};

const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const getStudentId = (user) => {
  const rawId = user?.id || user?._id || user?.studentId || user?.profileId;
  return rawId ? String(rawId) : "";
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
};

const getBrowserLabel = () => {
  const ua = navigator.userAgent;
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/edg/i.test(ua)) return "Microsoft Edge";
  if (/chrome/i.test(ua) && !/edg|opr|samsungbrowser/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) return "Safari";
  return "Browser";
};

// Memoized Quick Card Component
const QuickCard = React.memo(({ to, icon, title, subtitle }) => {
  return (
    <Link style={s.quickCard} className="student-quick-card" to={to}>
      <div style={s.quickCardTop}></div>
      <i className={icon} style={s.quickIcon}></i>
      <h3 style={s.quickTitle}>{title}</h3>
      <p style={s.quickSub}>{subtitle}</p>
    </Link>
  );
});

QuickCard.displayName = 'QuickCard';

export default function Dashboard() {
  const { user } = useAuth();
  const { academicYearLabel } = useActiveAcademicYear(user?.academicYear?.year);
  const [loading, setLoading] = useState(true);
  const [fee, setFee] = useState(null);
  const [attendance, setAttendance] = useState({ present: 0, absent: 0, totalWorkingDays: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [marksSummary, setMarksSummary] = useState({ subjectCount: 0, percentage: null });

  const studentId = getStudentId(user);

  // Memoize computed values
  const feeStatus = useMemo(() => 
    fee?.totalDue > 0 ? "Due" : fee ? "Paid" : "Unavailable",
    [fee]
  );

  const academicYear = useMemo(() => 
    academicYearLabel || fee?.academicYear?.year || "Academic Year",
    [academicYearLabel, fee]
  );

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!studentId) return;
      setLoading(true);
      const { month, year } = getMonthParts();

      const [feeResult, attendanceResult, announcementsResult, marksResult] = await Promise.allSettled([
        api.get(`/student-fees/student/${studentId}`),
        api.get(`/attendance/student-report?studentId=${studentId}&month=${month}&year=${year}`),
        api.get("/announcements?audience=student"),
        api.get(`/marks/report-card?studentId=${studentId}`)
      ]);

      if (feeResult.status === "fulfilled") {
        setFee(feeResult.value.data);
      } else {
        setFee(null);
      }

      if (attendanceResult.status === "fulfilled") {
        const data = attendanceResult.value.data;
        setAttendance({
          present: data.present || 0,
          absent: data.absent || 0,
          totalWorkingDays: data.total || 0
        });
      } else {
        setAttendance({ present: 0, absent: 0, totalWorkingDays: 0 });
      }

      if (announcementsResult.status === "fulfilled") {
        setAnnouncements((announcementsResult.value.data || []).slice(0, 3));
      } else {
        setAnnouncements([]);
      }

      if (marksResult.status === "fulfilled") {
        const subjects = marksResult.value.data?.subjects || {};
        const entries = Object.values(subjects).flat();
        const totalScored = entries.reduce((sum, entry) => sum + Number(entry.marksObtained || 0), 0);
        const totalMax = entries.reduce((sum, entry) => sum + Number(entry.maxMarks || 0), 0);
        setMarksSummary({
          subjectCount: Object.keys(subjects).length,
          percentage: totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : null
        });
      } else {
        setMarksSummary({ subjectCount: 0, percentage: null });
      }

      setLoading(false);
    };

    fetchDashboard();
  }, [studentId]);

  useEffect(() => {
    if (!studentId) setLoading(false);
  }, [studentId]);

  // Auto-enable notifications on component mount
  useEffect(() => {
    const autoEnableNotifications = async () => {
      try {
        if (isNativeAndroidApp()) {
          await registerNativePushForUser(user);
          return;
        }

        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          return;
        }

        if (!window.isSecureContext) {
          return;
        }

        const mobile = String(user?.mobile || "").trim();
        if (!mobile) {
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          return;
        }

        const { data } = await api.get("/push/vapid-public-key");
        if (!data?.publicKey) {
          return;
        }

        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const activeRegistration = await navigator.serviceWorker.ready;

        if (!activeRegistration?.active) {
          return;
        }

        const existingSubscription = await activeRegistration.pushManager.getSubscription();

        let subscription = existingSubscription;
        if (!subscription) {
          subscription = await activeRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(data.publicKey)
          });
        }

        await api.post("/push/subscribe", {
          mobile,
          subscription: subscription.toJSON(),
          browser: getBrowserLabel()
        });
      } catch (error) {
        // Silently fail - notifications are optional
        console.log("Notification setup:", error.message);
      }
    };

    if (user) {
      autoEnableNotifications();
    }
  }, [user]);

  return (
    <div style={s.page} className="student-dashboard-page">
      {loading && <div style={s.loading}>Loading dashboard...</div>}
      <div style={s.grid2} className="student-dashboard-grid">
        <div style={s.polaroidCard} className="student-polaroid-card">
          <div style={s.polaroidTop}></div>
          <div style={s.avatarWrap}>
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user?.name || "Student"} style={s.studentPhoto} />
            ) : (
              <div style={s.studentAvatar}>{user?.name?.charAt(0) || "S"}</div>
            )}
          </div>
          <h2 style={s.studentName}>{user?.name || "Student"}</h2>
          <p style={s.studentDetails}>Class {user?.class?.name || "-"}{user?.class?.section || ""} • {user?.satCode || "-"}</p>
          <div style={s.badgeRow} className="student-badge-row">
            <span style={s.yearPill}>{academicYear}</span>
            <span style={feeStatus === "Due" ? s.badgeDue : s.badgePaid}>
              {feeStatus === "Due" ? `Fees Due: ${formatCurrency(fee.totalDue)}` : feeStatus === "Paid" ? "Fees Paid" : "Fees Not Assigned"}
            </span>
          </div>
        </div>

        <div style={s.quickGrid} className="student-quick-grid">
          <QuickCard to="/student/attendance" icon="fa-solid fa-calendar-check" title="Attendance" subtitle={`${attendance.present} present • ${attendance.absent} absent • ${attendance.totalWorkingDays} working days`} />
          <QuickCard to="/student/marks" icon="fa-solid fa-ranking-star" title="Marks & Grades" subtitle={marksSummary.percentage !== null ? `${marksSummary.percentage}% across ${marksSummary.subjectCount} subjects` : "View report card"} />
          <QuickCard to="/student/fees" icon="fa-solid fa-wallet" title="Fee Details" subtitle={feeStatus === "Due" ? `${formatCurrency(fee.totalDue)} pending` : feeStatus === "Paid" ? "All clear" : "Check fee status"} />
          <QuickCard to="/student/profile" icon="fa-solid fa-id-card" title="My Profile" subtitle="View personal info" />
        </div>
      </div>

      <div style={s.card} className="student-card">
        <SectionTitle title="Latest Announcements" />
        {announcements.length > 0 ? (
          <div style={s.newsGrid} className="student-news-grid">
            {announcements.map(ann => (
              <article key={ann._id} style={s.newsCard}>
                <div style={s.newsDateBadge}>{new Date(ann.createdAt).toLocaleDateString()}</div>
                <div style={s.newsExcerpt}>{formatNoticeText(ann)}</div>
              </article>
            ))}
          </div>
        ) : (
          <div style={s.empty}>No announcements yet.</div>
        )}
        <div style={{textAlign: "center", marginTop: "24px"}}>
          <Link style={s.btnOutline} to="/student/announcements">View All Announcements</Link>
        </div>
      </div>
    </div>
  );
}

function formatNoticeText(announcement) {
  const title = String(announcement.title || "").trim();
  const content = String(announcement.content || "").trim();
  return [title, content].filter(Boolean).join("\n");
}

const s = {
  page: { width: "100%" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "36px", marginBottom: "40px" },
  card: { background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.99))", borderRadius: "22px", padding: "36px", boxShadow: "0 12px 48px rgba(14,107,107,0.12)", border: "1px solid rgba(200,150,12,0.12)", backdropFilter: "blur(10px)" },
  loading: { padding: "40px 32px", textAlign: "center", color: "var(--navy)", fontWeight: "800", fontSize: "1.1rem", background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.97))", borderRadius: "20px", border: "1px solid rgba(200,150,12,0.15)", boxShadow: "0 8px 32px rgba(14,107,107,0.08)" },
  empty: { padding: "36px 32px", textAlign: "center", color: "var(--navy)", background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95))", borderRadius: "20px", border: "1.5px dashed rgba(200,150,12,0.35)", fontWeight: "700", fontSize: "1rem", lineHeight: 1.6, boxShadow: "inset 0 0 32px rgba(200,150,12,0.08)" },

  polaroidCard: { background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.99))", borderRadius: "22px", padding: "36px", boxShadow: "0 16px 56px rgba(14,107,107,0.18)", border: "1px solid rgba(200,150,12,0.15)", textAlign: "center", position: "relative", overflow: "hidden", backdropFilter: "blur(10px)" },
  polaroidTop: { position: "absolute", top: 0, left: 0, right: 0, height: "8px", background: "linear-gradient(90deg, var(--gold), var(--gold-light), #f5c842)", borderRadius: "22px 22px 0 0" },
  avatarWrap: { display: "flex", justifyContent: "center", marginBottom: "28px", marginTop: "12px" },
  studentAvatar: { width: "120px", height: "120px", borderRadius: "50%", border: "6px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem", fontWeight: "800", color: "var(--gold)", boxShadow: "0 8px 32px rgba(200,150,12,0.35)", background: "linear-gradient(135deg, white, rgba(255,255,255,0.9))" },
  studentPhoto: { width: "120px", height: "120px", borderRadius: "50%", border: "6px solid var(--gold)", objectFit: "cover", boxShadow: "0 8px 32px rgba(200,150,12,0.35)", background: "linear-gradient(135deg, white, rgba(255,255,255,0.9))" },
  studentName: { fontFamily: "var(--font-heading)", color: "var(--navy-dark)", fontSize: "2rem", margin: "0 0 12px 0", fontWeight: "700", letterSpacing: "-0.02em" },
  studentDetails: { color: "var(--navy)", fontSize: "1.05rem", margin: "0 0 28px 0", fontWeight: "600", opacity: 0.9 },
  badgeRow: { display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "28px" },
  yearPill: { background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.98))", border: "2px solid rgba(14,107,107,0.2)", padding: "10px 22px", borderRadius: "30px", fontSize: "0.95rem", fontWeight: "800", color: "var(--navy)", boxShadow: "0 4px 16px rgba(14,107,107,0.1)" },
  badgePaid: { background: "linear-gradient(135deg, #e6f4ea, #d1e9d6)", border: "2px solid #137333", padding: "10px 22px", borderRadius: "30px", fontSize: "0.95rem", fontWeight: "800", color: "#137333", boxShadow: "0 4px 16px rgba(19,115,51,0.15)" },
  badgeDue: { background: "linear-gradient(135deg, #fce8e6, #fad2d0)", border: "2px solid #c5221f", padding: "10px 22px", borderRadius: "30px", fontSize: "0.95rem", fontWeight: "800", color: "#c5221f", boxShadow: "0 4px 16px rgba(197,34,31,0.15)" },
  notifyBtn: {
    marginTop: "24px",
    border: "none",
    background: "linear-gradient(135deg, var(--navy), var(--navy-dark))",
    color: "var(--white)",
    padding: "16px 28px",
    minHeight: "52px",
    borderRadius: "30px",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "1rem",
    boxShadow: "0 8px 24px rgba(14,107,107,0.35)",
    transition: "all 0.3s ease",
    width: "100%",
    maxWidth: "300px",
    margin: "0 auto"
  },
  notifyStatus: { margin: "16px 0 0", fontSize: "0.95rem", color: "var(--navy)", lineHeight: 1.5, fontWeight: "600", background: "rgba(255,255,255,0.8)", padding: "12px 18px", borderRadius: "16px", border: "1px solid rgba(200,150,12,0.2)" },

  quickGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  quickCard: { background: "linear-gradient(135deg, #051a1a 0%, #094f4f 100%)", borderRadius: "20px", padding: "28px", color: "var(--white)", cursor: "pointer", position: "relative", overflow: "hidden", transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)", boxShadow: "0 12px 36px rgba(9,79,79,0.35)", textDecoration: "none", minHeight: "180px", boxSizing: "border-box", border: "1px solid rgba(200,150,12,0.2)" },
  quickCardTop: { position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: "var(--gold)", borderRadius: "20px 20px 0 0" },
  quickIcon: { fontSize: "2.5rem", color: "var(--gold)", marginBottom: "20px", filter: "drop-shadow(0 4px 8px rgba(200,150,12,0.4))" },
  quickTitle: { fontFamily: "var(--font-heading)", fontSize: "1.5rem", margin: "0 0 8px 0", color: "var(--white)", fontWeight: "700", letterSpacing: "-0.01em" },
  quickSub: { color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", margin: 0, lineHeight: 1.5, fontWeight: "500" },

  newsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px" },
  newsCard: { background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.98))", border: "1.5px solid rgba(200,150,12,0.15)", borderRadius: "20px", padding: "28px", transition: "all 0.3s ease", boxShadow: "0 8px 24px rgba(14,107,107,0.08)", cursor: "pointer" },
  newsDateBadge: { display: "inline-block", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", padding: "8px 18px", borderRadius: "30px", fontSize: "0.9rem", fontWeight: "800", marginBottom: "16px", boxShadow: "0 4px 12px rgba(200,150,12,0.25)" },
  newsExcerpt: { color: "var(--navy-dark)", fontSize: "1.05rem", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontWeight: "600", opacity: 0.9 },
  btnOutline: { display: "inline-block", background: "transparent", border: "2px solid var(--navy)", color: "var(--navy)", padding: "14px 32px", borderRadius: "30px", fontWeight: "800", cursor: "pointer", transition: "all 0.3s ease", textDecoration: "none", fontSize: "1rem", marginTop: "8px", boxShadow: "0 4px 16px rgba(14,107,107,0.1)" }
};
