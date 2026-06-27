import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { useAuth } from "../../context/useAuth";
import SectionTitle from "../../components/SectionTitle";
import { getTeacherAssignedClasses, getTeacherSubjectForClass } from "../../utils/teacherClasses";

export default function Exams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classFilter, setClassFilter] = useState(searchParams.get("classId") || "");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", class: "", subject: "", maxMarks: 100, passMark: 35, examType: "Unit Test", date: "" });
  const preselectedSubjectId = searchParams.get("subjectId") || "";

  const getSubjectYearId = subjectId => {
    const selectedSubject = subjects.find(subject => subject._id === subjectId);
    return selectedSubject?.academicYear?._id || selectedSubject?.academicYear || "";
  };

  const fetchData = async () => {
    try {
      const [eRes, cRes, sRes, yRes] = await Promise.all([
        api.get(`/exams${classFilter ? `?classId=${classFilter}` : ""}`),
        api.get("/classes"),
        api.get("/subjects"),
        api.get("/academic-years/active")
      ]);
      setExams(eRes.data);
      setClasses(getTeacherAssignedClasses(user, cRes.data));
      setSubjects(sRes.data);
      if (yRes.data) setForm(f => ({ ...f, academicYear: yRes.data._id }));
    } catch (e) {
      console.error("Error fetching data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [classFilter, user]);

  const handleClassFilterChange = (value) => {
    setClassFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set("classId", value);
    else next.delete("classId");
    setSearchParams(next, { replace: true });
  };

  const openScheduleModal = () => {
    const nextClassId = classFilter || searchParams.get("classId") || "";
    const teacherSubject = getTeacherSubjectForClass(user, nextClassId, subjects, classes);
    const nextSubjectId = preselectedSubjectId || teacherSubject?._id || "";
    setForm(prev => ({
      ...prev,
      class: nextClassId,
      subject: nextSubjectId
    }));
    setIsModalOpen(true);
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...form,
        academicYear: form.academicYear || getSubjectYearId(form.subject)
      };

      if (!payload.academicYear) {
        alert("Please set an active academic year before creating an exam.");
        return;
      }

      const { data } = await api.post("/exams", payload);
      setIsModalOpen(false);
      await fetchData();
      if (data?._id) navigate(`/teacher/marks?examId=${data._id}`);
    } catch (e) {
      alert(e.response?.data?.message || "Creation failed");
    }
  };

  return (
    <div>
      <div style={s.header}>
        <SectionTitle title="All Exams" subtitle="View scheduled examination cycles for your assigned classes." />
        <button style={s.btn} onClick={openScheduleModal}>Schedule Exam</button>
      </div>

      <div style={s.filterRow}>
        <select style={s.input} value={classFilter} onChange={e => handleClassFilterChange(e.target.value)}>
          <option value="">All My Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}{c.section}</option>)}
        </select>
      </div>

      <div style={s.grid}>
        {!loading && exams.length === 0 && (
          <div style={s.empty}>No exams are scheduled for this class yet.</div>
        )}
        {exams.map(e => (
          <div key={e._id} style={s.examCard}>
            <div style={s.examHeader}>
              <span style={s.examType}>{e.examType}</span>
              <span style={s.examDate}>{e.date}</span>
            </div>
            <h3 style={s.examTitle}>{e.title}</h3>
            <p style={s.examInfo}><strong>Subject:</strong> {e.subject?.name}</p>
            <p style={s.examInfo}><strong>Class:</strong> {e.class?.name}{e.class?.section}</p>
            <div style={s.examFooter}>
              <span>{e.passMark}/{e.maxMarks} Pass</span>
              <button style={s.statsBtn} onClick={() => navigate(`/teacher/marks?examId=${e._id}`)}>Enter Marks</button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule New Exam"
        footer={<button style={s.submitBtn} onClick={handleCreate}>Schedule</button>}
      >
        <div style={s.form}>
          <input style={s.input} placeholder="Exam Title (e.g. Q1 Algebra)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <div style={s.row}>
            <select
              style={s.input}
              value={form.class}
              onChange={e => {
                const nextClassId = e.target.value;
                const teacherSubject = getTeacherSubjectForClass(user, nextClassId, subjects, classes);
                setForm({
                  ...form,
                  class: nextClassId,
                  subject: teacherSubject?._id || ""
                });
              }}
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}{c.section}</option>)}
            </select>
            <select
              style={s.input}
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value, academicYear: form.academicYear || getSubjectYearId(e.target.value) })}
            >
              <option value="">Select Subject</option>
              {subjects.filter(s => (s.class?._id || s.class) === form.class).map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
            </select>
          </div>
          <div style={s.row}>
            <input type="number" style={s.input} placeholder="Max Marks" value={form.maxMarks} onChange={e => setForm({ ...form, maxMarks: e.target.value })} />
            <input type="number" style={s.input} placeholder="Pass Mark" value={form.passMark} onChange={e => setForm({ ...form, passMark: e.target.value })} />
          </div>
          <input type="date" style={s.input} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

const s = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  title: { fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: 0 },
  sub: { fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", padding: "0.6rem 1.25rem", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
  filterRow: { maxWidth: "320px", marginBottom: "1.5rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" },
  empty: { gridColumn: "1 / -1", padding: "28px", textAlign: "center", background: "var(--white)", border: "1px dashed var(--border)", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "800" },
  examCard: { background: "#fff", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  examHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  examType: { fontSize: "0.7rem", fontWeight: "700", color: "#4f46e5", background: "#eef2ff", padding: "0.2rem 0.5rem", borderRadius: "4px", textTransform: "uppercase" },
  examDate: { fontSize: "0.75rem", color: "#64748b" },
  examTitle: { fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.5rem 0" },
  examInfo: { fontSize: "0.85rem", color: "#475569", margin: "0.25rem 0" },
  examFooter: { marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", fontWeight: "600", color: "#64748b" },
  statsBtn: { background: "none", border: "none", color: "#4f46e5", cursor: "pointer", fontWeight: "700" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  input: { width: "100%", padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.95rem", boxSizing: "border-box" },
  submitBtn: { padding: "0.75rem 1.25rem", background: "#4f46e5", color: "#fff", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer", width: "100%" }
};
