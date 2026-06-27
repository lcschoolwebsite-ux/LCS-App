import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SectionTitle from "../../components/SectionTitle";

const formatClassLabel = cls => [cls?.name, cls?.section].filter(Boolean).join(" ") || "Class";

export default function Subjects() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, subjectRes] = await Promise.all([
          api.get("/classes"),
          api.get("/subjects")
        ]);
        setClasses(classRes.data || []);
        setSubjects(subjectRes.data || []);
      } catch (e) {
        console.error("Failed to load class subjects", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const subjectCounts = useMemo(() => {
    return subjects.reduce((acc, subject) => {
      const classId = subject.class?._id || subject.class;
      acc[classId] = (acc[classId] || 0) + 1;
      return acc;
    }, {});
  }, [subjects]);

  return (
    <div>
      <SectionTitle
        title="Subjects"
        subtitle="Select a class to manage its class teacher and subject assignments."
      />

      {loading ? (
        <div style={s.loading}>Loading classes...</div>
      ) : classes.length === 0 ? (
        <div style={s.empty}>No classes have been created yet.</div>
      ) : (
        <div style={s.grid}>
          {classes.map((cls) => {
            const classId = cls._id;
            const subjectCount = subjectCounts[classId] || 0;

            return (
              <button
                key={classId}
                type="button"
                style={s.card}
                onClick={() => navigate(`/admin/subjects/${classId}`)}
              >
                <div style={s.cardTop}>
                  <div>
                    <div style={s.kicker}>Class</div>
                    <h3 style={s.title}>{formatClassLabel(cls)}</h3>
                  </div>
                  <i className="fa-solid fa-chalkboard" style={s.icon}></i>
                </div>

                <div style={s.metaRow}>
                  <span style={s.metaLabel}>Academic Year</span>
                  <span style={s.metaValue}>{cls.academicYear?.year || "N/A"}</span>
                </div>

                <div style={s.metaRow}>
                  <span style={s.metaLabel}>Class Teacher</span>
                  <span style={s.metaValue}>
                    {cls.classTeacher?.name || <span style={s.muted}>Not assigned</span>}
                  </span>
                </div>

                <div style={s.metaRow}>
                  <span style={s.metaLabel}>Class Teacher Subject</span>
                  <span style={s.metaValue}>
                    {cls.classTeacherSubject?.name || <span style={s.muted}>Not assigned</span>}
                  </span>
                </div>

                <div style={s.badgeRow}>
                  <span style={s.badge}>{subjectCount} Subjects</span>
                  <span style={s.linkText}>Open Management</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  loading: { padding: "32px", textAlign: "center", background: "var(--white)", borderRadius: "16px", border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: "700" },
  empty: { padding: "32px", textAlign: "center", background: "var(--white)", borderRadius: "16px", border: "1px dashed var(--border)", color: "var(--text-muted)", fontWeight: "700" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" },
  card: {
    textAlign: "left",
    background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.99))",
    border: "1px solid rgba(200,150,12,0.14)",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(14,107,107,0.08)"
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "16px" },
  kicker: { fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: "900", color: "var(--gold)" },
  title: { margin: "4px 0 0", color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.25rem" },
  icon: { color: "var(--gold)", fontSize: "1.2rem", marginTop: "2px" },
  metaRow: { display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--border)" },
  metaLabel: { fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" },
  metaValue: { fontSize: "0.9rem", fontWeight: "700", color: "var(--text)" },
  muted: { opacity: 0.55 },
  badgeRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "16px" },
  badge: { display: "inline-flex", alignItems: "center", padding: "6px 10px", borderRadius: "999px", background: "var(--gold-pale)", color: "var(--navy-dark)", fontSize: "0.72rem", fontWeight: "900" },
  linkText: { color: "var(--navy)", fontSize: "0.8rem", fontWeight: "800" }
};
