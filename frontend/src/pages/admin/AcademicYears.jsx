import { useState, useEffect } from "react";
import api from "../../api/axios";
import Table from "../../components/Table";
import Modal from "../../components/Modal";

export default function AcademicYears() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [form, setForm] = useState({ year: "", startDate: "", endDate: "" });

  const formatDateForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const resetForm = () => {
    setForm({ year: "", startDate: "", endDate: "" });
    setEditingYear(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (year) => {
    setEditingYear(year);
    setForm({
      year: year.year || "",
      startDate: formatDateForInput(year.startDate),
      endDate: formatDateForInput(year.endDate)
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const fetchYears = async () => {
    try {
      const { data } = await api.get("/academic-years");
      setYears(data);
    } catch (e) {
      alert("Error fetching academic years");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchYears(); }, []);

  const handleSubmit = async () => {
    try {
      if (editingYear) {
        await api.patch(`/academic-years/${editingYear._id}`, form);
      } else {
        await api.post("/academic-years", form);
      }
      closeModal();
      fetchYears();
    } catch (e) {
      alert(e.response?.data?.message || (editingYear ? "Update failed" : "Creation failed"));
    }
  };

  const handleSetActive = async (id) => {
    try {
      await api.patch(`/academic-years/active/${id}`);
      fetchYears();
      } catch (e) {
        alert("Failed to set active year");
      }
  };

  const handleDelete = async (year) => {
    const ok = window.confirm(`Delete academic year "${year.year}"? This cannot be undone.`);
    if (!ok) return;

    try {
      await api.delete(`/academic-years/${year._id}`);
      if (editingYear?._id === year._id) {
        closeModal();
      }
      fetchYears();
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Academic Year Configuration</h1>
          <p style={s.sub}>Manage the active sessions and date ranges for the school.</p>
        </div>
        <button style={s.btnPrimary} onClick={openCreateModal}>
          <i className="fa-solid fa-plus" style={{marginRight: '8px'}}></i> New Session
        </button>
      </div>

      <Table
        loading={loading}
        headers={["Session Year", "Start Date", "End Date", "Status", "Actions"]}
        data={years}
        renderRow={(y) => (
          <>
            <td style={s.td}><strong>{y.year}</strong></td>
            <td style={s.td}>{new Date(y.startDate).toLocaleDateString('en-GB')}</td>
            <td style={s.td}>{new Date(y.endDate).toLocaleDateString('en-GB')}</td>
            <td style={s.td}>
              <span style={{ ...s.badge, background: y.isActive ? "var(--success-bg)" : "var(--light-bg)", color: y.isActive ? "var(--success-text)" : "var(--text-muted)" }}>
                {y.isActive ? "Active Session" : "Inactive"}
              </span>
            </td>
            <td style={s.td}>
              <div style={s.actions}>
                <button style={s.actionBtn} onClick={() => openEditModal(y)}>
                  <i className="fa-solid fa-pen-to-square"></i> Edit
                </button>
                {!y.isActive && (
                  <button style={s.actionBtn} onClick={() => handleSetActive(y._id)}>
                    <i className="fa-solid fa-toggle-on"></i> Set as Active
                  </button>
                )}
                <button style={s.dangerBtn} onClick={() => handleDelete(y)}>
                  <i className="fa-solid fa-trash"></i> Delete
                </button>
              </div>
            </td>
          </>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingYear ? "Edit Academic Session" : "Add Academic Session"}
        subtitle={editingYear ? "Update the label or date range for this session." : "Specify the date range for the new academic year."}
        footer={(
          <div style={{display: 'flex', gap: '12px', width: '100%'}}>
            <button style={s.cancelBtn} onClick={closeModal}>Cancel</button>
            <button style={s.saveBtn} onClick={handleSubmit}>
              <i className={`fa-solid ${editingYear ? "fa-pen-to-square" : "fa-plus-circle"}`} style={{marginRight: '8px'}}></i>
              {editingYear ? "Save Changes" : "Save & Add Session"}
            </button>
          </div>
        )}
      >
        <div style={s.form}>
          <div style={s.formItem}>
            <label style={s.label}>Year Name / Label</label>
            <input style={s.input} value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="e.g. 2025-2026" />
          </div>
          <div style={s.row}>
            <div style={s.formItem}>
              <label style={s.label}>Session Start Date</label>
              <input type="date" style={s.input} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div style={s.formItem}>
              <label style={s.label}>Session End Date</label>
              <input type="date" style={s.input} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
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
  badge: { padding: "6px 14px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: '0.02em' },
  actions: { display: "flex", flexWrap: "wrap", gap: "8px" },
  actionBtn: { background: "var(--white)", border: "1.5px solid var(--navy)", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", color: "var(--navy)", fontWeight: "700", transition: 'all 0.2s' },
  dangerBtn: { background: "var(--white)", border: "1.5px solid #dc2626", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", color: "#dc2626", fontWeight: "700", transition: 'all 0.2s' },
  form: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  formItem: { display: "flex", flexDirection: "column", gap: "6px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  label: { fontSize: "0.7rem", fontWeight: "800", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em" },
  input: { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "0.95rem", boxSizing: "border-box", background: 'var(--white)', fontFamily: 'var(--font-body)' },
  cancelBtn: { padding: "12px 20px", background: "var(--light-bg)", border: "none", color: "var(--text-muted)", fontWeight: "700", cursor: "pointer", borderRadius: "10px" },
  saveBtn: { flex: 1, padding: "12px 24px", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", borderRadius: "10px", border: "none", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(200,150,12,0.2)", animation: 'shimmer 3s linear infinite' }
};
