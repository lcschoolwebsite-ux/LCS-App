import { useState, useEffect } from "react";
import api from "../../api/axios";
import Table from "../../components/Table";
import Modal from "../../components/Modal";

const formatClassName = cls => [cls?.name, cls?.section].filter(Boolean).join(" ") || "";
const getClassTeacherClass = (teacherId, classes = []) =>
  classes.find(cls => String(cls.classTeacher?._id || cls.classTeacher || "") === String(teacherId || "")) || null;

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", email: "", phone: "" });
  const [credentialForm, setCredentialForm] = useState({ username: "", password: "" });
  const [assignForm, setAssignForm] = useState({ classIds: [] });

  const fetchData = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        api.get("/teachers"),
        api.get("/classes")
      ]);
      setTeachers(tRes.data);
      setClasses(cRes.data);
    } catch (e) {
      alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setForm({ name: "", username: "", password: "", email: "", phone: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setIsEditing(true);
    setSelectedTeacher(t);
    setForm({ name: t.name, username: t.username, password: "", email: t.email, phone: t.phone });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const trimmedPassword = form.password.trim();
      const payload = {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim()
      };
      if (trimmedPassword) payload.password = trimmedPassword;

      if (isEditing) {
        await api.put(`/teachers/${selectedTeacher._id}`, payload);
        alert("Teacher updated successfully!");
      } else {
        if (!trimmedPassword) {
          alert("Set a temporary password for the teacher.");
          return;
        }
        await api.post("/teachers", { ...payload, password: trimmedPassword });
        alert("Teacher registered successfully!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || "Operation failed");
    }
  };

  const openCredentialsModal = (teacher) => {
    setSelectedTeacher(teacher);
    setCredentialForm({ username: teacher.username || "", password: "" });
    setIsCredentialsOpen(true);
  };

  const handleCredentialsSave = async () => {
    try {
      const payload = { username: credentialForm.username.trim() };
      if (credentialForm.password.trim()) payload.password = credentialForm.password.trim();
      if (!payload.username) {
        alert("Set a username for the teacher.");
        return;
      }

      await api.put(`/teachers/${selectedTeacher._id}`, payload);
      alert("Teacher login credentials updated successfully!");
      setIsCredentialsOpen(false);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || "Credential update failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/teachers/${id}`);
      alert("Teacher deleted successfully!");
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  const handleAssign = async () => {
    try {
      await api.put(`/teachers/${selectedTeacher._id}/classes`, assignForm);
      setIsAssignOpen(false);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || "Assignment failed");
    }
  };

  const openAssignModal = (teacher) => {
    setSelectedTeacher(teacher);
    setAssignForm({
      classIds: teacher.assignedClasses?.map(c => c._id) || []
    });
    setIsAssignOpen(true);
  };

  const toggleClassAssignment = (classId) => {
    setAssignForm(prev => {
      const exists = prev.classIds.includes(classId);
      return {
        classIds: exists
          ? prev.classIds.filter(id => id !== classId)
          : [...prev.classIds, classId]
      };
    });
  };

  const toggleStatus = async (t) => {
    try {
      await api.put(`/teachers/${t._id}`, { isActive: !t.isActive });
      fetchData();
    } catch (e) {
      alert("Status update failed");
    }
  };

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Staff Directory</h1>
          <p style={s.sub}>Manage educator profiles and their class responsibilities.</p>
        </div>
        <button style={s.btnPrimary} onClick={handleOpenCreate}>
          <i className="fa-solid fa-user-plus" style={{marginRight: '8px'}}></i> Register Teacher
        </button>
      </div>

      <Table
        loading={loading}
        headers={["Teacher Name", "Username", "Email", "Assigned Classes", "Class Teacher", "Status", "Actions"]}
        data={teachers}
        renderRow={(t) => (
          <>
            <td style={s.td}><strong>{t.name}</strong></td>
            <td style={s.td}>{t.username}</td>
            <td style={s.td}>{t.email}</td>
            <td style={s.td}>
              {t.assignedClasses?.map(c => `${c.name}${c.section}`).join(", ") || <span style={{opacity: 0.5}}>None</span>}
            </td>
            <td style={s.td}>
              {(() => {
                const classTeacherClass = getClassTeacherClass(t._id, classes);
                return classTeacherClass
                  ? formatClassName(classTeacherClass)
                  : <span style={{opacity: 0.5}}>None</span>;
              })()}
            </td>
            <td style={s.td}>
              <span style={{ ...s.badge, background: t.isActive ? "var(--success-bg)" : "var(--danger-bg)", color: t.isActive ? "var(--success-text)" : "var(--danger-text)" }}>
                {t.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td style={s.td}>
              <div style={s.actions}>
                <button style={s.actionBtn} onClick={() => handleOpenEdit(t)}>
                  <i className="fa-solid fa-pen"></i> Edit
                </button>
                <button style={s.actionBtn} onClick={() => openAssignModal(t)}>
                  <i className="fa-solid fa-link"></i> Assign
                </button>
                <button style={s.actionBtn} onClick={() => openCredentialsModal(t)}>
                  <i className="fa-solid fa-key"></i> Credentials
                </button>
                <button style={{...s.actionBtn, color: 'var(--danger-text)', borderColor: 'var(--danger-text)'}} onClick={() => handleDelete(t._id)}>
                  <i className="fa-solid fa-trash"></i> Delete
                </button>
              </div>
            </td>
          </>
        )}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Edit Teacher Profile" : "Register New Teacher"}
        subtitle={isEditing ? "Modify educator details and credentials." : "Create a new educator account and set initial credentials."}
        footer={(
          <div style={{display: 'flex', gap: '12px', width: '100%'}}>
            <button style={s.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button style={s.saveBtn} onClick={handleSave}>
              <i className="fa-solid fa-floppy-disk" style={{marginRight: '8px'}}></i> {isEditing ? "Save Changes" : "Register Teacher"}
            </button>
          </div>
        )}
      >
        <div style={s.form}>
          <div style={s.formItem}>
            <label style={s.label}>Full Name</label>
            <input style={s.input} placeholder="e.g. John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={s.row}>
            <div style={s.formItem}>
              <label style={s.label}>Username</label>
              <input style={s.input} placeholder="Login Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div style={s.formItem}>
              <label style={s.label}>{isEditing ? "New Password (Optional)" : "Temporary Password"}</label>
              <input style={s.input} type="password" placeholder={isEditing ? "Leave blank to keep current" : "Min 6 characters"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <div style={s.row}>
            <div style={s.formItem}>
              <label style={s.label}>Email Address</label>
              <input style={s.input} placeholder="email@school.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div style={s.formItem}>
              <label style={s.label}>Phone Number</label>
              <input style={s.input} placeholder="+91 0000000000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCredentialsOpen}
        onClose={() => setIsCredentialsOpen(false)}
        title="Teacher Login Credentials"
        subtitle={`Set portal access for ${selectedTeacher?.name || "this teacher"}.`}
        maxWidth="520px"
        footer={(
          <div style={{display: 'flex', gap: '12px', width: '100%'}}>
            <button style={s.cancelBtn} onClick={() => setIsCredentialsOpen(false)}>Cancel</button>
            <button style={s.saveBtn} onClick={handleCredentialsSave}>
              <i className="fa-solid fa-key" style={{marginRight: '8px'}}></i> Save Credentials
            </button>
          </div>
        )}
      >
        <div style={s.form}>
          <div style={s.formItem}>
            <label style={s.label}>Login Username</label>
            <input
              style={s.input}
              placeholder="Teacher login username"
              value={credentialForm.username}
              onChange={e => setCredentialForm({ ...credentialForm, username: e.target.value })}
            />
          </div>
          <div style={s.formItem}>
            <label style={s.label}>New Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="Leave blank to keep current password"
              value={credentialForm.password}
              onChange={e => setCredentialForm({ ...credentialForm, password: e.target.value })}
            />
            <p style={s.helpText}>Enter a new password only when you want to reset teacher access.</p>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Class Assignments"
        subtitle={`Select all classes handled by ${selectedTeacher?.name || "this teacher"}`}
        footer={(
          <div style={{display: 'flex', gap: '12px', width: '100%'}}>
            <button style={s.cancelBtn} onClick={() => setIsAssignOpen(false)}>Cancel</button>
            <button style={s.saveBtn} onClick={handleAssign}>
              <i className="fa-solid fa-link" style={{marginRight: '8px'}}></i> Save Assignments
            </button>
          </div>
        )}
      >
        <div style={s.form}>
          <div style={s.formItem}>
            <label style={s.label}>Assigned Classes</label>
            <div style={s.classGrid}>
              {classes.map(c => (
                <label
                  key={c._id}
                  style={{
                    ...s.classOption,
                    ...(assignForm.classIds.includes(c._id) ? s.classOptionActive : {})
                  }}
                >
                  <input
                    type="checkbox"
                    checked={assignForm.classIds.includes(c._id)}
                    onChange={() => toggleClassAssignment(c._id)}
                    style={s.checkbox}
                  />
                  <span>{c.name} - {c.section}</span>
                </label>
              ))}
            </div>
            <div style={s.assignmentSummary}>
              {assignForm.classIds.length} class{assignForm.classIds.length === 1 ? "" : "es"} selected
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
  badge: { padding: "4px 10px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "800", textTransform: "uppercase" },
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  actionBtn: { background: "var(--white)", border: "1.5px solid var(--navy)", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", color: "var(--navy)", fontWeight: "700", display: 'flex', alignItems: 'center', gap: '4px' },
  form: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  formItem: { display: "flex", flexDirection: "column", gap: "6px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  label: { fontSize: "0.7rem", fontWeight: "800", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em" },
  input: { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "0.95rem", boxSizing: "border-box", background: 'var(--white)', fontFamily: 'var(--font-body)' },
  classGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px", maxHeight: "320px", overflowY: "auto", padding: "4px" },
  classOption: { display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: "1.5px solid var(--border)", borderRadius: "10px", background: "var(--white)", color: "var(--text)", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer" },
  classOptionActive: { borderColor: "var(--gold)", background: "var(--gold-pale)", color: "var(--navy-dark)" },
  checkbox: { width: "16px", height: "16px", accentColor: "var(--gold)" },
  assignmentSummary: { marginTop: "8px", color: "var(--text-muted)", fontSize: "0.82rem", fontWeight: "700" },
  helpText: { margin: "2px 0 0", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: "600" },
  cancelBtn: { padding: "12px 20px", background: "var(--light-bg)", border: "none", color: "var(--text-muted)", fontWeight: "700", cursor: "pointer", borderRadius: "10px" },
  saveBtn: { flex: 1, padding: "12px 24px", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", borderRadius: "10px", border: "none", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(200,150,12,0.2)", animation: 'shimmer 3s linear infinite' }
};
