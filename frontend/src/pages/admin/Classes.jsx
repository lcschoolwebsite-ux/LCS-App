import { useState, useEffect } from "react";
import api from "../../api/axios";
import Table from "../../components/Table";
import Modal from "../../components/Modal";

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [years, setYears] = useState([]);
  const [activeYear, setActiveYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [form, setForm] = useState({ name: "", section: "", academicYear: "" });

  const fetchData = async () => {
    try {
      const [yRes, cRes] = await Promise.all([
        api.get("/academic-years"),
        api.get("/classes")
      ]);
      setYears(yRes.data);
      setClasses(cRes.data);
      const active = yRes.data.find(y => y.isActive);
      setActiveYear(active);
      if (active) setForm(f => ({ ...f, academicYear: active._id }));
    } catch (e) {
      alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = (academicYear = activeYear?._id || "") => {
    setForm({ name: "", section: "", academicYear });
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedClass(null);
    resetForm(activeYear?._id || "");
    setIsModalOpen(true);
  };

  const openEditModal = (cls) => {
    setIsEditing(true);
    setSelectedClass(cls);
    setForm({
      name: cls.name || "",
      section: cls.section || "",
      academicYear: cls.academicYear?._id || cls.academicYear || activeYear?._id || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        section: form.section.trim(),
        academicYear: form.academicYear
      };

      if (isEditing) {
        await api.put(`/classes/${selectedClass._id}`, payload);
      } else {
        await api.post("/classes", payload);
      }

      setIsModalOpen(false);
      setSelectedClass(null);
      setIsEditing(false);
      resetForm(activeYear?._id || "");
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || (isEditing ? "Update failed" : "Creation failed"));
    }
  };

  const handleDelete = async (cls) => {
    const classLabel = `${cls.name || ""}${cls.section || ""}`.trim() || "this class";
    const confirmed = window.confirm(`Delete ${classLabel}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/classes/${cls._id}`);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Class Management</h1>
          <p style={s.sub}>
            Managing classes for session: <strong style={{color: 'var(--gold)'}}>{activeYear?.year || "Not Set"}</strong>
          </p>
        </div>
        <button style={s.btnPrimary} onClick={openCreateModal}>
          <i className="fa-solid fa-plus" style={{marginRight: '8px'}}></i> Add New Class
        </button>
      </div>

      <Table
        loading={loading}
        headers={["Class Name", "Section", "Academic Year", "Class Teacher", "Actions"]}
        data={classes}
        renderRow={(c) => (
          <>
            <td style={s.td}><strong>{c.name}</strong></td>
            <td style={s.td}>{c.section}</td>
            <td style={s.td}>{c.academicYear?.year}</td>
            <td style={s.td}>{c.classTeacher?.name || <span style={{opacity: 0.5}}>Not Assigned</span>}</td>
            <td style={s.td}>
              <div style={s.actions}>
                <button style={s.actionBtn} onClick={() => openEditModal(c)}>
                  <i className="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button style={{...s.actionBtn, ...s.deleteBtn}} onClick={() => handleDelete(c)}>
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
        title={isEditing ? "Edit Class" : "Register New Class"}
        subtitle={isEditing ? "Update the class details and academic session." : "Create a new class division and assign it to an academic session."}
        footer={(
          <div style={{display: 'flex', gap: '12px', width: '100%'}}>
            <button style={s.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button style={s.saveBtn} onClick={handleSave}>
              <i className={`fa-solid ${isEditing ? "fa-floppy-disk" : "fa-plus-circle"}`} style={{marginRight: '8px'}}></i>
              {isEditing ? "Save Changes" : "Save & Add Class"}
            </button>
          </div>
        )}
      >
        <div style={s.form}>
          <div style={s.row}>
            <div style={s.formItem}>
              <label style={s.label}>Class Level</label>
              <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. 10th Standard" />
            </div>
            <div style={s.formItem}>
              <label style={s.label}>Section / Division</label>
              <input style={s.input} value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="e.g. A" />
            </div>
          </div>
            <div style={s.formItem}>
              <label style={s.label}>Academic Session</label>
              <select style={s.input} value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })}>
                <option value="" disabled>Select session</option>
                {years.map(y => (
                  <option key={y._id} value={y._id}>{y.year} {y.isActive ? "(Current Active)" : ""}</option>
                ))}
              </select>
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
  actions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  actionBtn: { background: "var(--white)", border: "1.5px solid var(--navy)", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", color: "var(--navy)", fontWeight: "700" },
  deleteBtn: { color: "var(--danger-text)", borderColor: "var(--danger-text)" },
  form: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  formItem: { display: "flex", flexDirection: "column", gap: "6px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  label: { fontSize: "0.7rem", fontWeight: "800", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em" },
  input: { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "0.95rem", boxSizing: "border-box", background: 'var(--white)', fontFamily: 'var(--font-body)' },
  cancelBtn: { padding: "12px 20px", background: "var(--light-bg)", border: "none", color: "var(--text-muted)", fontWeight: "700", cursor: "pointer", borderRadius: "10px" },
  saveBtn: { flex: 1, padding: "12px 24px", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", borderRadius: "10px", border: "none", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(200,150,12,0.2)", animation: 'shimmer 3s linear infinite' }
};
