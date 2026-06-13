import React, { useEffect, useState } from "react";
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

export default function Dashboard() {
  const { user } = useAuth();
  const { academicYearLabel } = useActiveAcademicYear(user?.academicYear?.year);
  const [loading, setLoading] = useState(true);
  const [fee, setFee] = useState(null);
  const [attendance, setAttendance] = useState({ present: 0, absent: 0, totalWorkingDays: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [marksSummary, setMarksSummary] = useState({ subjectCount: 0, percentage: null });
  const [notifyStatus, setNotifyStatus] = useState("");

  const studentId = user?.id || user?._id;

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

  const enableNotifications = async () => {
    try {
      setNotifyStatus("");

      if (isNativeAndroidApp()) {
        await registerNativePushForUser(user);
        setNotifyStatus("Push notifications enabled for this Android app.");
        return;
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("This browser does not support push notifications.");
      }

      if (!window.isSecureContext) {
        throw new Error("Push notifications require a secure connection (HTTPS).");
      }

      const mobile = String(user?.mobile || "").trim();
      if (!mobile) {
        throw new Error("No registered mobile number found for this account.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const { data } = await api.get("/push/vapid-public-key");
      if (!data?.publicKey) {
        throw new Error("Push notifications are not configured on the server.");
      }

      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const activeRegistration = await navigator.serviceWorker.ready;

      if (!activeRegistration?.active) {
        throw new Error("Service worker is still starting up. Please try again in a moment.");
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

      setNotifyStatus("Notifications enabled successfully.");
    } catch (error) {
      setNotifyStatus(error.message || "Failed to enable notifications.");
      alert(error.message || "Failed to enable notifications.");
    }
  };

  const feeStatus = fee?.totalDue > 0 ? "Due" : fee ? "Paid" : "Unavailable";
  const academicYear = academicYearLabel || fee?.academicYear?.year || "Academic Year";

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
          <button type="button" onClick={enableNotifications} style={s.notifyBtn}>
            <i className="fa-solid fa-bell" style={{ marginRight: "8px" }} />
            Enable Notifications
          </button>
          {notifyStatus && <p style={s.notifyStatus}>{notifyStatus}</p>}
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

function QuickCard({ to, icon, title, subtitle }) {
  return (
    <Link style={s.quickCard} className="student-quick-card" to={to}>
      <div style={s.quickCardTop}></div>
      <i className={icon} style={s.quickIcon}></i>
      <h3 style={s.quickTitle}>{title}</h3>
      <p style={s.quickSub}>{subtitle}</p>
    </Link>
  );
}

function formatNoticeText(announcement) {
  const title = String(announcement.title || "").trim();
  const content = String(announcement.content || "").trim();
  return [title, content].filter(Boolean).join("\n");
}

const s = {
  page: { width: "100%" },
  grid2: { display: "grid", gridTemplateColumns: "minmax(280px, 0.9fr) minmax(0, 1.6fr)", gap: "24px", marginBottom: "32px" },
  card: { background: "var(--white)", borderRadius: "16px", padding: "32px", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)" },
  loading: { padding: "24px", textAlign: "center", color: "var(--text-muted)", fontWeight: "800" },
  empty: { padding: "24px", textAlign: "center", color: "var(--text-muted)", background: "var(--light-bg)", borderRadius: "12px", border: "1px dashed var(--border)" },

  polaroidCard: { background: "var(--white)", borderRadius: "16px", padding: "32px", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)", textAlign: "center", position: "relative", overflow: "hidden" },
  polaroidTop: { position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: "linear-gradient(90deg, var(--gold), var(--gold-light))" },
  avatarWrap: { display: "flex", justifyContent: "center", marginBottom: "20px", marginTop: "10px" },
  studentAvatar: { width: "100px", height: "100px", borderRadius: "50%", border: "4px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", fontWeight: "800", color: "var(--gold)", boxShadow: "0 0 20px rgba(200,150,12,0.3)" },
  studentPhoto: { width: "100px", height: "100px", borderRadius: "50%", border: "4px solid var(--gold)", objectFit: "cover", boxShadow: "0 0 20px rgba(200,150,12,0.3)" },
  studentName: { fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.6rem", margin: "0 0 8px 0" },
  studentDetails: { color: "var(--text-muted)", fontSize: "0.95rem", margin: "0 0 20px 0" },
  badgeRow: { display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" },
  yearPill: { background: "var(--light-bg)", border: "1px solid var(--border)", padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700", color: "var(--text-muted)" },
  badgePaid: { background: "var(--success-bg)", border: "1px solid var(--success-text)", padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "800", color: "var(--success-text)" },
  badgeDue: { background: "var(--danger-bg)", border: "1px solid var(--danger-text)", padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "800", color: "var(--danger-text)" },
  notifyBtn: {
    marginTop: "18px",
    border: "none",
    background: "linear-gradient(135deg, var(--navy), var(--navy-dark))",
    color: "var(--white)",
    padding: "12px 18px",
    borderRadius: "999px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)"
  },
  notifyStatus: { margin: "10px 0 0", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 },

  quickGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  quickCard: { background: "linear-gradient(135deg, var(--navy-dark), var(--navy))", borderRadius: "16px", padding: "24px", color: "var(--white)", cursor: "pointer", position: "relative", overflow: "hidden", transition: "var(--transition)", boxShadow: "var(--shadow-md)", textDecoration: "none", minHeight: "148px", boxSizing: "border-box" },
  quickCardTop: { position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "var(--gold)" },
  quickIcon: { fontSize: "2rem", color: "var(--gold)", marginBottom: "16px" },
  quickTitle: { fontFamily: "var(--font-heading)", fontSize: "1.3rem", margin: "0 0 4px 0", color: "var(--white)" },
  quickSub: { color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", margin: 0, lineHeight: 1.4 },

  newsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" },
  newsCard: { background: "var(--light-bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", transition: "var(--transition)" },
  newsDateBadge: { display: "inline-block", background: "var(--gold)", color: "var(--navy-dark)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "800", marginBottom: "12px" },
  newsExcerpt: { color: "var(--text-muted)", fontSize: "0.95rem", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontWeight: "600" },
  btnOutline: { display: "inline-block", background: "transparent", border: "2px solid var(--navy)", color: "var(--navy)", padding: "10px 24px", borderRadius: "50px", fontWeight: "700", cursor: "pointer", transition: "var(--transition)", textDecoration: "none" }
};
