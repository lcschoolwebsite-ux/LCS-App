import { useState } from "react";
import { useAuth } from "../../context/useAuth";

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    alert("Profile updated successfully!");
    setIsEditing(false);
  };

  return (
    <div style={s.container}>
      <div style={s.headerRow}>
        <h1 style={s.title}>My Profile</h1>
        <button 
          style={isEditing ? s.saveBtn : s.editBtn} 
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
        >
          {isEditing ? "Save Profile" : "Edit Profile"}
        </button>
      </div>
      
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.avatar}>{user?.name?.[0]}</div>
          <div>
            <h2 style={s.name}>{user?.name}</h2>
            <p style={s.role}>Staff / Educator</p>
          </div>
        </div>

        <div style={s.grid}>
          <div style={s.section}>
            <h3 style={s.sectionTitle}>Contact Information</h3>
            <DetailItem label="Email Address" value={user?.email} isEditing={isEditing} />
            <DetailItem label="Phone Number" value={user?.phone} isEditing={isEditing} />
          </div>

          <div style={s.section}>
            <h3 style={s.sectionTitle}>Work Details</h3>
            <DetailItem label="Username" value={user?.username} />
            <DetailItem label="Assigned Classes" value={user?.assignedClasses?.map(c => `${c.name}${c.section}`).join(", ") || "None"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, isEditing }) {
  return (
    <div style={s.item}>
      <span style={s.label}>{label}</span>
      {isEditing ? (
        <input style={s.input} defaultValue={value} />
      ) : (
        <span style={s.value}>{value || "N/A"}</span>
      )}
    </div>
  );
}

const s = {
  container: { width: "100%" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  title: { fontSize: "1.75rem", fontWeight: "800", color: "#1e293b", margin: 0 },
  editBtn: { background: "var(--white)", color: "var(--navy)", border: "2px solid var(--navy)", padding: "10px 24px", borderRadius: "30px", fontWeight: "700", cursor: "pointer", transition: "var(--transition)" },
  saveBtn: { background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", border: "none", padding: "10px 24px", borderRadius: "30px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(200,150,12,0.3)" },
  card: { background: "#fff", padding: "2.5rem", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0" },
  header: { display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2.5rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "2rem" },
  avatar: { width: "80px", height: "80px", borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: "800", border: "4px solid var(--gold)" },
  name: { fontSize: "1.5rem", fontWeight: "800", color: "#1e293b", margin: 0 },
  role: { fontSize: "0.85rem", color: "var(--gold)", fontWeight: "700", marginTop: "0.25rem", letterSpacing: "0.05em", textTransform: "uppercase" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" },
  section: { marginBottom: "1rem" },
  sectionTitle: { fontSize: "0.75rem", fontWeight: "800", color: "var(--navy)", marginBottom: "1.25rem", borderBottom: "2px solid var(--gold-pale)", paddingBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" },
  item: { marginBottom: "1.25rem", display: "flex", flexDirection: "column" },
  label: { fontSize: "0.7rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" },
  value: { fontSize: "1rem", color: "#1e293b", fontWeight: "600" },
  input: { padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--border)", fontSize: "0.95rem", width: "100%", background: "var(--light-bg)" }
};
