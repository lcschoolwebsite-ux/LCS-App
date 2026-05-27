import { useState, useEffect } from "react";
import api from "../../api/axios";
import Table from "../../components/Table";
import Modal from "../../components/Modal";

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [form, setForm] = useState({ name: "", class: "", teacher: "", academicYear: "" });

  const fetchData = async () => {
    try {
      const [sRes, cRes, tRes, yRes] = await Promise.all([
        api.get("/subjects"),
        api.get("/classes"),
        api.get("/teachers"),
        api.get("/academic-years/active")
      ]);
      setSubjects(sRes.data);
      setClasses(cRes.data);
      setTeachers(tRes.data);
      if (yRes.data) setForm(f => ({ ...f, academicYear: yRes.data._id }));
    } catch (e) {
      console.error("Error fetching data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedSubject(null);
    setForm(f => ({ ...f, name: "", class: "", teacher: "" }));
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setIsEditing(true);
    setSelectedSubject(subject);
    setForm({
      name: subject.name || "",
      class: subject.class?._id || "",
      teacher: subject.teacher?._id || "",
      academicYear: subject.academicYear?._id || form.academicYear
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        class: form.class,
        teacher: form.teacher,
        academicYear: form.academicYear
      };

      if (!payload.name || !payload.class || !payload.academicYear) {
        alert("Subject name, class, and academic session are required.");
        return;
      }

      if (isEditing) {
        await api.put(`/subjects/${selectedSubject._id}`, payload);
        alert("Subject updated successfully!");
      } else {
        await api.post("/subjects", payload);
        alert("Subject added successfully!");
      }
      setIsModalOpen(false);
      setForm({ ...form, name: "", teacher: "" });
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || "Save failed");
    }
  };

  const handleDelete = async (subject) => {
    if (!window.confirm(`Delete ${subject.name}? This will remove the teacher's subject assignment too.`)) return;
    try {
      await api.delete(`/subjects/${subject._id}`);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Subject Management</h1>
          <p style={s.sub}>Define subjects and assign responsible faculty members.</p>
        </div>
        <button style={s.btnPrimary} onClick={openCreateModal}>
          <i className="fa-solid fa-plus" style={{marginRight: '8px'}}></i> Add Subject
        </button>
      </div>

      <Table
        loading={loading}
        headers={["Subject Name", "Class", "Subject Teacher", "Academic Session", "Actions"]}
        data={subjects}
        renderRow={(sub) => (
          <>
            <td style={s.td}><strong>{sub.name}</strong></td>
            <td style={s.td}>{sub.class?.name}{sub.class?.section}</td>
            <td style={s.td}>{sub.teacher?.name || <span style={{opacity: 0.5}}>Not Assigned</span>}</td>
            <td style={s.td}>{sub.academicYear?.year || "N/A"}</td>
            <td style={s.td}>
              <div style={s.actions}>
                <button style={s.actionBtn} onClick={() => openEditModal(sub)}>
                  <i className="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button style={{ ...s.actionBtn, color: "var(--danger-text)", borderColor: "var(--danger-text)" }} onClick={() => handleDelete(sub)}>
                  <i className="fa-solid fa-trash"></i> Delete
                </button>
              </div>
            </td>
          </>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Subject" : "Add New Subject"}
        subtitle={isEditing ? "Update the subject, class, and responsible faculty member." : "Specify subject details and assign a teacher for a specific class."}
        footer={(
          <div style={{display: 'flex', gap: '12px', width: '100%'}}>
            <button style={s.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button style={s.saveBtn} onClick={handleSave}>
              <i className="fa-solid fa-floppy-disk" style={{marginRight: '8px'}}></i> {isEditing ? "Save Changes" : "Save & Add Subject"}
            </button>
          </div>
        )}
      >
        <div style={s.form}>
          <div style={s.formItem}>
            <label style={s.label}>Subject Name</label>
            <input style={s.input} placeholder="e.g. Mathematics" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={s.row}>
            <div style={s.formItem}>
              <label style={s.label}>Assign to Class</label>
              <select style={s.input} value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}{c.section}</option>)}
              </select>
            </div>
            <div style={s.formItem}>
              <label style={s.label}>Subject Teacher</label>
              <select style={s.input} value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })}>
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <p style={s.helpText}>Saving assigns this subject to the selected teacher portal.</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const s = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" },
  title: { fontSize: "1.75rem", fontWeight: "800", color: "var(--navy)", margin: 0, fontFamily: "var(--font-heading)" },
  sub: { fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.4rem" },
  btnPrimary: { background: "linear-gradient(135deg, var(--navy), var(--navy-dark))", color: "var(--white)", border: "none", padding: "12px 24px", borderRadius: "30px", fontWeight: "700", cursor: "pointer", boxShadow: "var(--shadow-md)" },
  td: { padding: "16px 20px", fontSize: "0.95rem", color: "var(--text)", borderBottom: "1px solid var(--border)" },
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  actionBtn: { background: "var(--white)", border: "1.5px solid var(--navy)", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", color: "var(--navy)", fontWeight: "700" },
  form: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  formItem: { display: "flex", flexDirection: "column", gap: "6px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  label: { fontSize: "0.7rem", fontWeight: "800", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em" },
  input: { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "0.95rem", boxSizing: "border-box", background: 'var(--white)', fontFamily: 'var(--font-body)' },
  helpText: { margin: "2px 0 0", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: "600" },
  cancelBtn: { padding: "12px 20px", background: "var(--light-bg)", border: "none", color: "var(--text-muted)", fontWeight: "700", cursor: "pointer", borderRadius: "10px" },
  saveBtn: { flex: 1, padding: "12px 24px", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", borderRadius: "10px", border: "none", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(200,150,12,0.2)", animation: 'shimmer 3s linear infinite' }
};
