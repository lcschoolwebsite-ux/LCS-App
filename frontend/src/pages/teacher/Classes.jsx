import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SectionTitle from "../../components/SectionTitle";
import { useAuth } from "../../context/useAuth";
import { formatClassLabel, getTeacherAssignedClasses } from "../../utils/teacherClasses";

export default function Classes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/classes");
        setClasses(data || []);
      } catch (e) {
        console.error("Failed to load teacher classes", e);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const myClasses = useMemo(() => getTeacherAssignedClasses(user, classes), [user, classes]);

  return (
    <div>
      <div style={s.headerRow}>
        <SectionTitle
          title="My Classes"
          subtitle="Open one of your assigned classes to work with students, attendance, exams, and marks."
        />
      </div>

      {loading ? (
        <div style={s.empty}>Loading your assigned classes...</div>
      ) : myClasses.length === 0 ? (
        <div style={s.empty}>No classes are assigned to your teacher account yet.</div>
      ) : (
        <div style={s.grid}>
          {myClasses.map(cls => (
            <button
              key={cls._id}
              type="button"
              style={s.card}
              onClick={() => navigate(`/teacher/classes/${cls._id}`)}
            >
              <div style={s.cardTop}>
                <span style={s.badge}>Assigned</span>
                <span style={s.arrow}><i className="fa-solid fa-arrow-right"></i></span>
              </div>
              <h3 style={s.title}>{formatClassLabel(cls)}</h3>
              <p style={s.meta}>Academic Year: {cls.academicYear?.year || "N/A"}</p>
              <p style={s.meta}>Class Teacher: {cls.classTeacher?.name || "Not set"}</p>
              <p style={s.meta}>Class Teacher Subject: {cls.classTeacherSubject?.name || "Not set"}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  headerRow: { marginBottom: "1.5rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" },
  card: {
    textAlign: "left",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbfb 100%)",
    border: "1px solid rgba(14,107,107,0.12)",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  badge: {
    background: "rgba(200,150,12,0.12)",
    color: "var(--navy)",
    border: "1px solid rgba(200,150,12,0.25)",
    borderRadius: "999px",
    padding: "4px 10px",
    fontSize: "0.72rem",
    fontWeight: "800",
    textTransform: "uppercase"
  },
  arrow: { color: "var(--navy)", fontSize: "0.9rem" },
  title: { margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "var(--navy-dark)" },
  meta: { margin: "8px 0 0", color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.5 },
  empty: {
    padding: "28px",
    textAlign: "center",
    background: "var(--white)",
    border: "1px dashed var(--border)",
    borderRadius: "12px",
    color: "var(--text-muted)",
    fontWeight: "800"
  }
};
