import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import SectionTitle from "../../components/SectionTitle";

const formatClassLabel = cls => [cls?.name, cls?.section].filter(Boolean).join(" ") || "Class";

export default function ClassManagement() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);
  const [classTeacherId, setClassTeacherId] = useState("");
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", teacher: "" });

  const loadData = async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const { data: payload } = await api.get(`/classes/${classId}/management`);
      setData(payload);
      setClassTeacherId(payload.class?.classTeacher?._id || "");
    } catch (e) {
      console.error("Failed to load class management data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classId]);

  const currentClass = data?.class;
  const subjects = data?.subjects || [];
  const teachers = data?.teachers || [];

  const teacherOptions = useMemo(() => teachers.filter(Boolean), [teachers]);

  const openCreateSubject = () => {
    setEditingSubject(null);
    setSubjectForm({ name: "", teacher: "" });
    setSubjectModalOpen(true);
  };

  const openEditSubject = (subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name || "",
      teacher: subject.teacher?._id || ""
    });
    setSubjectModalOpen(true);
  };

  const handleSubjectSave = async () => {
    if (!currentClass) return;
    const payload = {
      name: subjectForm.name.trim(),
      class: currentClass._id,
      academicYear: currentClass.academicYear?._id || currentClass.academicYear,
      teacher: subjectForm.teacher || ""
    };

    if (!payload.name) {
      alert("Subject name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, payload);
      } else {
        await api.post("/subjects", payload);
      }
      setSubjectModalOpen(false);
      setEditingSubject(null);
      setSubjectForm({ name: "", teacher: "" });
      await loadData();
    } catch (e) {
      alert(e.response?.data?.message || "Unable to save subject");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (subject) => {
    if (!confirm(`Delete ${subject.name}?`)) return;
    setSaving(true);
    try {
      await api.delete(`/subjects/${subject._id}`);
      await loadData();
    } catch (e) {
      alert(e.response?.data?.message || "Unable to delete subject");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSubjectTeacher = async (subject) => {
    setSaving(true);
    try {
      await api.put(`/subjects/${subject._id}`, {
        name: subject.name,
        class: currentClass._id,
        academicYear: currentClass.academicYear?._id || currentClass.academicYear,
        teacher: ""
      });
      await loadData();
    } catch (e) {
      alert(e.response?.data?.message || "Unable to remove teacher");
    } finally {
      setSaving(false);
    }
  };

  const handleClassTeacherSave = async (nextTeacherId) => {
    if (!currentClass) return;
    setSaving(true);
    try {
      await api.put(`/classes/${currentClass._id}`, {
        name: currentClass.name,
        section: currentClass.section,
        academicYear: currentClass.academicYear?._id || currentClass.academicYear,
        classTeacher: nextTeacherId || ""
      });
      await loadData();
    } catch (e) {
      alert(e.response?.data?.message || "Unable to update class teacher");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={s.loading}>Loading class management...</div>;
  }

  if (!currentClass) {
    return (
      <div style={s.empty}>
        <div>Class not found.</div>
        <button style={s.backBtn} onClick={() => navigate("/admin/subjects")}>Back to Classes</button>
      </div>
    );
  }

  return (
    <div>
      <div style={s.header}>
        <div>
          <SectionTitle
            title={`Manage ${formatClassLabel(currentClass)}`}
            subtitle="Assign a class teacher and manage subjects for this class."
          />
        </div>
        <button style={s.backBtn} onClick={() => navigate("/admin/subjects")}>
          <i className="fa-solid fa-arrow-left" style={{ marginRight: 8 }}></i>
          Back
        </button>
      </div>

      <div style={s.infoGrid}>
        <div style={s.infoCard}>
          <div style={s.cardLabel}>Academic Year</div>
          <div style={s.cardValue}>{currentClass.academicYear?.year || "N/A"}</div>
        </div>
        <div style={s.infoCard}>
          <div style={s.cardLabel}>Class Teacher</div>
          <div style={s.cardValue}>{currentClass.classTeacher?.name || "Not assigned"}</div>
        </div>
        <div style={s.infoCard}>
          <div style={s.cardLabel}>Subjects</div>
          <div style={s.cardValue}>{subjects.length}</div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionHead}>
          <div>
            <h3 style={s.sectionTitle}>Class Teacher</h3>
            <p style={s.sectionSub}>Only one class teacher can be assigned at a time.</p>
          </div>
        </div>

        <div style={s.teacherShell}>
          <div style={s.teacherCurrent}>
            <div style={s.teacherAvatar}>
              {currentClass.classTeacher?.name?.[0] || "S"}
            </div>
            <div>
              <div style={s.teacherName}>{currentClass.classTeacher?.name || "No teacher assigned"}</div>
              <div style={s.teacherMeta}>
                Employee ID: {currentClass.classTeacher?.username || "N/A"}
              </div>
              <div style={s.teacherMeta}>
                Phone: {currentClass.classTeacher?.phone || "Optional"}
              </div>
            </div>
          </div>

          <div style={s.teacherControls}>
            <select
              style={s.select}
              value={classTeacherId}
              onChange={(e) => setClassTeacherId(e.target.value)}
            >
              <option value="">Select teacher</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name} {teacher.phone ? `• ${teacher.phone}` : ""}
                </option>
              ))}
            </select>

            <div style={s.buttonRow}>
              <button style={s.primaryBtn} onClick={() => handleClassTeacherSave(classTeacherId)} disabled={saving}>
                {currentClass.classTeacher ? "Change Class Teacher" : "Assign Class Teacher"}
              </button>
              <button style={s.dangerBtn} onClick={() => handleClassTeacherSave("")} disabled={saving || !currentClass.classTeacher}>
                Remove Class Teacher
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionHead}>
          <div>
            <h3 style={s.sectionTitle}>Subjects</h3>
            <p style={s.sectionSub}>Add subjects for this class and assign teachers subject-wise.</p>
          </div>
          <button style={s.primaryBtn} onClick={openCreateSubject}>
            <i className="fa-solid fa-plus" style={{ marginRight: 8 }}></i>
            Add Subject
          </button>
        </div>

        {subjects.length === 0 ? (
          <div style={s.emptyMini}>No subjects have been added to this class yet.</div>
        ) : (
          <div style={s.subjectList}>
            {subjects.map((subject) => (
              <div key={subject._id} style={s.subjectCard}>
                <div style={s.subjectMain}>
                  <div>
                    <div style={s.subjectName}>{subject.name}</div>
                    <div style={s.subjectTeacher}>
                      Teacher: {subject.teacher?.name || <span style={s.muted}>Not assigned</span>}
                    </div>
                    <div style={s.subjectMeta}>
                      {subject.teacher?.phone ? `Phone: ${subject.teacher.phone}` : "Teacher phone optional"}
                    </div>
                  </div>
                  <div style={s.subjectActions}>
                    <button style={s.actionBtn} onClick={() => openEditSubject(subject)}>Edit Subject</button>
                    <button style={s.actionBtn} onClick={() => handleRemoveSubjectTeacher(subject)}>
                      Remove Teacher
                    </button>
                    <button style={s.deleteBtn} onClick={() => handleDeleteSubject(subject)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        title={editingSubject ? "Edit Subject" : "Add Subject"}
        subtitle="Manage the subject name and its assigned teacher."
        footer={(
          <div style={s.modalFooter}>
            <button style={s.secondaryBtn} onClick={() => setSubjectModalOpen(false)}>Cancel</button>
            <button style={s.primaryBtn} onClick={handleSubjectSave} disabled={saving}>
              {editingSubject ? "Save Changes" : "Add Subject"}
            </button>
          </div>
        )}
      >
        <div style={s.form}>
          <div style={s.formItem}>
            <label style={s.label}>Subject Name</label>
            <input
              style={s.input}
              value={subjectForm.name}
              onChange={(e) => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Mathematics"
            />
          </div>
          <div style={s.formItem}>
            <label style={s.label}>Assigned Teacher</label>
            <select
              style={s.input}
              value={subjectForm.teacher}
              onChange={(e) => setSubjectForm(prev => ({ ...prev, teacher: e.target.value }))}
            >
              <option value="">Not assigned</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name} {teacher.phone ? `• ${teacher.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const s = {
  loading: { padding: "40px", textAlign: "center", background: "var(--white)", borderRadius: "16px", border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: "700" },
  empty: { padding: "40px", textAlign: "center", background: "var(--white)", borderRadius: "16px", border: "1px solid var(--border)", display: "grid", gap: "14px", justifyItems: "center" },
  emptyMini: { padding: "24px", textAlign: "center", background: "var(--white)", borderRadius: "14px", border: "1px dashed var(--border)", color: "var(--text-muted)", fontWeight: "700" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" },
  backBtn: { background: "var(--white)", color: "var(--navy)", border: "1px solid var(--border)", padding: "10px 14px", borderRadius: "999px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "20px" },
  infoCard: { background: "var(--white)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px", boxShadow: "var(--shadow-sm)" },
  cardLabel: { fontSize: "0.68rem", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" },
  cardValue: { color: "var(--navy)", fontSize: "1.05rem", fontWeight: "800" },
  section: { background: "var(--white)", border: "1px solid var(--border)", borderRadius: "18px", padding: "20px", boxShadow: "var(--shadow-sm)", marginBottom: "20px" },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" },
  sectionTitle: { margin: 0, color: "var(--navy)", fontFamily: "var(--font-heading)", fontSize: "1.2rem" },
  sectionSub: { margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.85rem" },
  teacherShell: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  teacherCurrent: { background: "var(--light-bg)", border: "1px solid var(--border)", borderRadius: "14px", padding: "16px", display: "flex", gap: "14px", alignItems: "center" },
  teacherAvatar: { width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", display: "grid", placeItems: "center", fontWeight: "900", flex: "0 0 auto" },
  teacherName: { fontWeight: "900", color: "var(--navy)", fontSize: "1rem" },
  teacherMeta: { marginTop: "4px", color: "var(--text-muted)", fontSize: "0.8rem" },
  teacherControls: { display: "grid", gap: "12px", alignContent: "start" },
  select: { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "0.95rem", background: "var(--white)" },
  buttonRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  primaryBtn: { background: "linear-gradient(135deg, var(--navy), var(--navy-dark))", color: "var(--white)", border: "none", padding: "10px 14px", borderRadius: "10px", fontWeight: "800", cursor: "pointer" },
  secondaryBtn: { background: "var(--light-bg)", color: "var(--text)", border: "none", padding: "10px 14px", borderRadius: "10px", fontWeight: "800", cursor: "pointer" },
  dangerBtn: { background: "var(--danger-bg)", color: "var(--danger-text)", border: "none", padding: "10px 14px", borderRadius: "10px", fontWeight: "800", cursor: "pointer" },
  subjectList: { display: "grid", gap: "12px" },
  subjectCard: { border: "1px solid var(--border)", borderRadius: "14px", padding: "16px", background: "var(--light-bg)" },
  subjectMain: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" },
  subjectName: { fontSize: "1rem", fontWeight: "900", color: "var(--navy)" },
  subjectTeacher: { marginTop: "6px", color: "var(--text)", fontWeight: "700" },
  subjectMeta: { marginTop: "4px", color: "var(--text-muted)", fontSize: "0.8rem" },
  subjectActions: { display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" },
  actionBtn: { background: "var(--white)", border: "1px solid var(--navy)", color: "var(--navy)", padding: "8px 12px", borderRadius: "8px", fontWeight: "800", cursor: "pointer" },
  deleteBtn: { background: "var(--danger-bg)", border: "1px solid var(--danger-text)", color: "var(--danger-text)", padding: "8px 12px", borderRadius: "8px", fontWeight: "800", cursor: "pointer" },
  muted: { opacity: 0.55 },
  form: { display: "grid", gap: "14px" },
  formItem: { display: "grid", gap: "6px" },
  label: { fontSize: "0.7rem", fontWeight: "900", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em" },
  input: { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "0.95rem", background: "var(--white)" },
  modalFooter: { display: "flex", gap: "12px", width: "100%" }
};
