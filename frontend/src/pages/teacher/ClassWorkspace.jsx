import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import SectionTitle from "../../components/SectionTitle";
import { useAuth } from "../../context/useAuth";
import { formatClassLabel, getTeacherAssignedClasses, isClassTeacher } from "../../utils/teacherClasses";

const getLocalDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().split("T")[0];
};

export default function ClassWorkspace() {
  const { classId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [attendanceState, setAttendanceState] = useState({ alreadyMarked: false, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      setLoading(true);
      try {
        const [classesRes, studentsRes, examsRes] = await Promise.all([
          api.get("/classes"),
          classId ? api.get("/students", { params: { classId } }) : Promise.resolve({ data: [] }),
          api.get("/exams", { params: { classId } })
        ]);

        setClasses(classesRes.data || []);
        setStudents(studentsRes.data?.data || studentsRes.data || []);
        setExams(examsRes.data || []);

        const selectedClass = (classesRes.data || []).find(item => String(item._id) === String(classId));
        if (selectedClass && isClassTeacher(user, selectedClass)) {
          try {
            const attendanceRes = await api.get(`/attendance?classId=${classId}&date=${getLocalDate()}`);
            setAttendanceState({
              alreadyMarked: Boolean(attendanceRes.data.alreadyMarked),
              count: attendanceRes.data.students?.length || 0
            });
          } catch (e) {
            console.error("Failed to load attendance status", e);
          }
        } else {
          setAttendanceState({ alreadyMarked: false, count: 0 });
        }
      } catch (e) {
        console.error("Failed to load class workspace", e);
      } finally {
        setLoading(false);
      }
    };

    if (classId) fetchWorkspace();
  }, [classId, user]);

  const myClasses = useMemo(() => getTeacherAssignedClasses(user, classes), [user, classes]);
  const selectedClass = myClasses.find(item => String(item._id) === String(classId));
  const firstExamId = exams[0]?._id || "";
  const canTakeAttendance = isClassTeacher(user, selectedClass);

  if (!classId) {
    return (
      <div style={s.empty}>
        Select one of your assigned classes to open the workspace.
      </div>
    );
  }

  if (!loading && !selectedClass) {
    return <div style={s.empty}>This class is not assigned to your account.</div>;
  }

  return (
    <div>
      <div style={s.hero}>
        <div>
          <p style={s.eyebrow}>Class Workspace</p>
          <h1 style={s.title}>{selectedClass ? formatClassLabel(selectedClass) : "Loading..."}</h1>
          <p style={s.subtitle}>
            Open the class once and jump to the full toolset for students, attendance, marks, and exams.
          </p>
        </div>
        <button style={s.backBtn} onClick={() => navigate("/teacher/classes")}>
          <i className="fa-solid fa-arrow-left" style={{ marginRight: "8px" }}></i>
          Back to classes
        </button>
      </div>

      {loading ? (
        <div style={s.empty}>Loading class details...</div>
      ) : (
        <>
          <div style={s.grid}>
            <div style={s.statCard}>
              <span style={s.statLabel}>Students</span>
              <strong style={s.statValue}>{students.length}</strong>
            </div>
            <div style={s.statCard}>
              <span style={s.statLabel}>Exams</span>
              <strong style={s.statValue}>{exams.length}</strong>
            </div>
            <div style={s.statCard}>
              <span style={s.statLabel}>Attendance</span>
              <strong style={s.statValue}>{canTakeAttendance ? (attendanceState.alreadyMarked ? "Marked" : "Open") : "Restricted"}</strong>
            </div>
          </div>

          <div style={s.actionGrid}>
            <ActionCard title="Students" desc="View and edit the students in this class." onClick={() => navigate(`/teacher/students?classId=${classId}`)} icon="fa-users" />
            <ActionCard title="Add Student" desc="Register a new student directly into this class." onClick={() => navigate(`/teacher/students/add?classId=${classId}`)} icon="fa-user-plus" />
            <ActionCard title="Attendance" desc={canTakeAttendance ? "Mark or update attendance for class days." : "Attendance is available only to the class teacher."} onClick={() => canTakeAttendance && navigate(`/teacher/attendance?classId=${classId}`)} icon="fa-clipboard-user" disabled={!canTakeAttendance} />
            <ActionCard title="Exams" desc="Open scheduled exams for this class." onClick={() => navigate(`/teacher/exams?classId=${classId}`)} icon="fa-file-lines" />
            <ActionCard title="Marks" desc="Enter marks for the latest exam." onClick={() => navigate(`/teacher/marks${firstExamId ? `?examId=${firstExamId}` : `?classId=${classId}`}`)} icon="fa-pen-to-square" />
          </div>
        </>
      )}
    </div>
  );
}

function ActionCard({ title, desc, onClick, icon, disabled = false }) {
  return (
    <button
      type="button"
      style={{ ...s.actionCard, ...(disabled ? s.actionCardDisabled : {}) }}
      onClick={onClick}
      disabled={disabled}
    >
      <div style={s.actionIcon}><i className={`fa-solid ${icon}`}></i></div>
      <h3 style={s.actionTitle}>{title}</h3>
      <p style={s.actionDesc}>{desc}</p>
    </button>
  );
}

const s = {
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "1.5rem",
    flexWrap: "wrap"
  },
  eyebrow: {
    margin: 0,
    color: "var(--gold-light)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "0.75rem",
    fontWeight: "800"
  },
  title: { margin: "6px 0 8px", fontSize: "1.9rem", fontWeight: "900", color: "var(--navy)" },
  subtitle: { margin: 0, color: "var(--text-muted)", maxWidth: "720px", lineHeight: 1.6 },
  backBtn: {
    border: "1px solid rgba(14,107,107,0.18)",
    background: "var(--white)",
    color: "var(--navy)",
    borderRadius: "999px",
    padding: "10px 16px",
    fontWeight: "800",
    cursor: "pointer"
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem", marginBottom: "1.5rem" },
  statCard: {
    background: "var(--white)",
    border: "1px solid rgba(14,107,107,0.12)",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "var(--shadow-sm)"
  },
  statLabel: { display: "block", fontSize: "0.76rem", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" },
  statValue: { fontSize: "1.7rem", color: "var(--navy-dark)" },
  actionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem" },
  actionCard: {
    textAlign: "left",
    background: "linear-gradient(180deg, #fff 0%, #f8fbfb 100%)",
    border: "1px solid rgba(14,107,107,0.12)",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
    cursor: "pointer"
  },
  actionCardDisabled: { opacity: 0.55, cursor: "not-allowed" },
  actionIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    background: "rgba(200,150,12,0.14)",
    color: "var(--navy)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
    fontSize: "1.1rem"
  },
  actionTitle: { margin: 0, fontSize: "1.02rem", fontWeight: "900", color: "var(--navy-dark)" },
  actionDesc: { margin: "8px 0 0", color: "var(--text-muted)", lineHeight: 1.55, fontSize: "0.9rem" },
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

