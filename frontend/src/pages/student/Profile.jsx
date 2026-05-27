import { useAuth } from "../../context/useAuth";
import useActiveAcademicYear from "../../hooks/useActiveAcademicYear";

export default function Profile() {
  const { user } = useAuth();
  const classLabel = [user?.class?.name, user?.class?.section].filter(Boolean).join("");
  const { academicYearLabel } = useActiveAcademicYear(user?.academicYear?.year);

  return (
    <div style={s.container} className="student-profile-page">
      <h1 style={s.title}>My Profile</h1>
      
      <div style={s.card} className="student-profile-card">
        <div style={s.header} className="student-profile-header">
          <div style={s.photoWrap}>
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user?.name || "Student"} style={s.photo} />
            ) : (
              <div style={s.avatar}>{user?.name?.[0] || "S"}</div>
            )}
          </div>
          <div>
            <h2 style={s.name}>{user?.name || "Student"}</h2>
            <p style={s.role}>{classLabel ? `Class ${classLabel}` : "Student Portal"}</p>
          </div>
        </div>

        <div style={s.grid} className="student-profile-grid">
          <div style={s.section}>
            <h3 style={s.sectionTitle}>Personal Information</h3>
            <DetailItem label="Full Name" value={user?.name} />
            <DetailItem label="Date of Birth" value={user?.dob} />
            <DetailItem label="Mobile No." value={user?.mobile || "N/A"} />
            <DetailItem label="Mobile No. 2" value={user?.alternateMobile || "N/A"} />
            <DetailItem label="Email" value={user?.email || "N/A"} />
            <DetailItem label="Address" value={user?.address || "N/A"} />
          </div>

          <div style={s.section}>
            <h3 style={s.sectionTitle}>Academic Details</h3>
            <DetailItem label="SATS No." value={user?.satCode} />
            <DetailItem label="PEN Code" value={user?.penCode} />
            <DetailItem label="Class" value={classLabel} />
            <DetailItem label="Academic Year" value={academicYearLabel} />
          </div>

          <div style={s.section}>
            <h3 style={s.sectionTitle}>Parental Details</h3>
            <DetailItem label="Father's Name" value={user?.fatherName} />
            <DetailItem label="Mother's Name" value={user?.motherName} />
          </div>
        </div>
      </div>
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
  title: { fontSize: "1.75rem", fontWeight: "800", color: "#2d3748", marginBottom: "2rem" },
  card: { background: "#fff", padding: "2.5rem", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #edf2f7" },
  header: { display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2.5rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "2rem" },
  photoWrap: { position: "relative", width: "88px", height: "88px", flex: "0 0 auto" },
  avatar: { width: "80px", height: "80px", borderRadius: "50%", background: "#d69e2e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "800" },
  photo: { width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--gold)" },
  name: { fontSize: "1.5rem", fontWeight: "800", color: "#1a202c", margin: 0 },
  role: { fontSize: "0.85rem", color: "#d69e2e", fontWeight: "700", marginTop: "0.25rem", letterSpacing: "0.05em" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" },
  section: { marginBottom: "1rem" },
  sectionTitle: { fontSize: "1rem", fontWeight: "800", color: "#2d3748", marginBottom: "1.25rem", borderBottom: "1px solid #f7fafc", paddingBottom: "0.5rem" },
  item: { marginBottom: "0.75rem", display: "flex", flexDirection: "column" },
  label: { fontSize: "0.75rem", color: "#718096", fontWeight: "600", textTransform: "uppercase" },
  value: { fontSize: "0.95rem", color: "#2d3748", fontWeight: "500", marginTop: "0.1rem" }
};
