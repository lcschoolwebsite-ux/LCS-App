import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";

const formatList = (items, fallback = "N/A") => {
  if (!items || items.length === 0) return fallback;
  return items.join(", ");
};

const formatClass = cls => [cls?.name, cls?.section].filter(Boolean).join(" ") || "N/A";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/auth/me");
      setProfile(data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load profile");
      setProfile(user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // We intentionally load the latest teacher profile from the API so the page
    // reflects the current backend state even after assignments change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignedClasses = useMemo(
    () => (profile?.assignedClasses || []).map(formatClass),
    [profile?.assignedClasses]
  );

  const assignedSubjects = useMemo(
    () => (profile?.assignedSubjects || []).map(subject => subject?.name).filter(Boolean),
    [profile?.assignedSubjects]
  );

  return (
    <div style={s.container}>
      <div style={s.headerRow}>
        <div>
          <h1 style={s.title}>My Profile</h1>
          <p style={s.subtitle}>View your account, contact details, and assigned classes.</p>
        </div>
        <button style={s.refreshBtn} onClick={fetchProfile} disabled={loading}>
          <i className={`fa-solid ${loading ? "fa-circle-notch fa-spin" : "fa-rotate-right"}`} style={{ marginRight: "8px" }}></i>
          Refresh
        </button>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      {loading ? (
        <div style={s.loading}><i className="fa-solid fa-circle-notch fa-spin"></i> Loading profile...</div>
      ) : (
        <div style={s.card}>
          <div style={s.profileHeader}>
            <div style={s.avatar}>{profile?.name?.[0] || "T"}</div>
            <div>
              <h2 style={s.name}>{profile?.name || "Teacher"}</h2>
              <p style={s.role}>Staff / Educator</p>
              <p style={s.meta}>Username: <strong>{profile?.username || "N/A"}</strong></p>
            </div>
          </div>

          <div style={s.grid}>
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Contact Information</h3>
              <DetailItem label="Email Address" value={profile?.email} />
              <DetailItem label="Phone Number" value={profile?.phone} />
            </div>

            <div style={s.section}>
              <h3 style={s.sectionTitle}>Work Details</h3>
              <DetailItem label="Assigned Classes" value={formatList(assignedClasses)} />
              <DetailItem label="Assigned Subjects" value={formatList(assignedSubjects)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div style={s.item}>
      <span style={s.label}>{label}</span>
      <span style={s.value}>{value || "N/A"}</span>
    </div>
  );
}

const s = {
  container: { width: "100%" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "1.5rem", flexWrap: "wrap" },
  title: { fontSize: "1.75rem", fontWeight: "800", color: "var(--navy)", margin: 0 },
  subtitle: { marginTop: "0.35rem", color: "var(--text-muted)", fontSize: "0.9rem" },
  refreshBtn: { background: "var(--white)", color: "var(--navy)", border: "2px solid var(--navy)", padding: "10px 20px", borderRadius: "30px", fontWeight: "700", cursor: "pointer", transition: "var(--transition)" },
  errorBox: { background: "var(--danger-bg)", color: "var(--danger-text)", border: "1px solid var(--danger-text)", padding: "12px 16px", borderRadius: "10px", fontWeight: "800", marginBottom: "1rem" },
  loading: { padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "1.05rem", background: "var(--white)", borderRadius: "16px", border: "1px solid var(--border)" },
  card: { background: "#fff", padding: "2.25rem", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  profileHeader: { display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1.5rem" },
  avatar: { width: "84px", height: "84px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "900", border: "4px solid rgba(14,107,107,0.08)" },
  name: { fontSize: "1.5rem", fontWeight: "800", color: "#1e293b", margin: 0 },
  role: { fontSize: "0.85rem", color: "var(--gold)", fontWeight: "700", marginTop: "0.25rem", letterSpacing: "0.05em", textTransform: "uppercase" },
  meta: { fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.4rem" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" },
  section: { marginBottom: "1rem" },
  sectionTitle: { fontSize: "0.75rem", fontWeight: "800", color: "var(--navy)", marginBottom: "1.25rem", borderBottom: "2px solid var(--gold-pale)", paddingBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  item: { marginBottom: "1.1rem", display: "flex", flexDirection: "column" },
  label: { fontSize: "0.7rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" },
  value: { fontSize: "1rem", color: "#1e293b", fontWeight: "600", lineHeight: 1.5 }
};
