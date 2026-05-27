import { useState, useEffect } from "react";
import api from "../../api/axios";
import Table from "../../components/Table";
import Modal from "../../components/Modal";

export default function AcademicYears() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ year: "", startDate: "", endDate: "" });

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

  const handleCreate = async () => {
    try {
      await api.post("/academic-years", form);
      setIsModalOpen(false);
      setForm({ year: "", startDate: "", endDate: "" });
      fetchYears();
    } catch (e) {
      alert(e.response?.data?.message || "Creation failed");
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

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Academic Year Configuration</h1>
          <p style={s.sub}>Manage the active sessions and date ranges for the school.</p>
        </div>
        <button style={s.btnPrimary} onClick={() => setIsModalOpen(true)}>
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
              {!y.isActive && (
                <button style={s.actionBtn} onClick={() => handleSetActive(y._id)}>
                  <i className="fa-solid fa-toggle-on"></i> Set as Active
                </button>
              )}
            </td>
          </>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Academic Session"
        subtitle="Specify the date range for the new academic year."
        footer={(
          <div style={{display: 'flex', gap: '12px', width: '100%'}}>
            <button style={s.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button style={s.saveBtn} onClick={handleCreate}>
              <i className="fa-solid fa-plus-circle" style={{marginRight: '8px'}}></i> Save & Add Session
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
  actionBtn: { background: "var(--white)", border: "1.5px solid var(--navy)", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", color: "var(--navy)", fontWeight: "700", transition: 'all 0.2s' },
  form: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  formItem: { display: "flex", flexDirection: "column", gap: "6px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  label: { fontSize: "0.7rem", fontWeight: "800", color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.08em" },
  input: { width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1.5px solid var(--border)", fontSize: "0.95rem", boxSizing: "border-box", background: 'var(--white)', fontFamily: 'var(--font-body)' },
  cancelBtn: { padding: "12px 20px", background: "var(--light-bg)", border: "none", color: "var(--text-muted)", fontWeight: "700", cursor: "pointer", borderRadius: "10px" },
  saveBtn: { flex: 1, padding: "12px 24px", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", borderRadius: "10px", border: "none", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 15px rgba(200,150,12,0.2)", animation: 'shimmer 3s linear infinite' }
};
