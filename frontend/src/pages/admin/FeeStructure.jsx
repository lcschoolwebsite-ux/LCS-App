import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import SectionTitle from "../../components/SectionTitle";

export default function FeeStructure() {
  const [academicYears, setAcademicYears] = useState([]);
  const [activeAY, setActiveAY] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [feeTypes, setFeeTypes] = useState([]);
  const [newFeeType, setNewFeeType] = useState("");
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    feeItems: [{ feeType: "", amount: "" }]
  });

  const fetchInitialData = async () => {
    try {
      const { data } = await api.get("/academic-years");
      setAcademicYears(data);
      const active = data.find(y => y.isActive) || data[0];
      if (active) setActiveAY(active._id);
      
      const clRes = await api.get("/classes");
      setClasses(clRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchYearlyData = async () => {
    if (!activeAY) return;
    setLoading(true);
    try {
      const [ftRes, stRes] = await Promise.all([
        api.get(`/fee-types?academicYear=${activeAY}`),
        api.get(`/fee-structure?academicYear=${activeAY}`)
      ]);
      setFeeTypes(ftRes.data);
      setStructures(stRes.data);
      
      if (selectedClass) {
        const existing = stRes.data.find(s => s.class?._id === selectedClass._id);
        if (existing) {
          setForm({
            feeItems: existing.feeItems.map(item => ({ 
              feeType: item.feeType?._id, 
              amount: item.amount 
            }))
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { fetchYearlyData(); }, [activeAY]);

  const handleAddFeeType = async () => {
    if (!newFeeType || !activeAY) return;
    try {
      await api.post("/fee-types", { name: newFeeType, academicYear: activeAY });
      setNewFeeType("");
      fetchYearlyData();
    } catch (e) { alert("Failed to add fee type"); }
  };

  const handleDeleteFeeType = async (id) => {
    try {
      await api.delete(`/fee-types/${id}`);
      fetchYearlyData();
    } catch (e) { alert("Failed to delete"); }
  };

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
    const existing = structures.find(s => s.class?._id === cls._id);
    if (existing) {
      setForm({
        feeItems: existing.feeItems.map(item => ({ 
          feeType: item.feeType?._id || item.feeType, 
          amount: item.amount 
        }))
      });
    } else {
      setForm({ feeItems: [{ feeType: "", amount: "" }] });
    }
  };

  const handleAddItem = () => {
    setForm({ ...form, feeItems: [...form.feeItems, { feeType: "", amount: "" }] });
  };

  const handleRemoveItem = (index) => {
    const items = [...form.feeItems];
    items.splice(index, 1);
    setForm({ ...form, feeItems: items });
  };

  const totalAnnual = form.feeItems.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const handleSave = async () => {
    if (!selectedClass || !activeAY) return alert("Select class and year");
    
    const validItems = form.feeItems.filter(i => i.feeType && i.amount);
    if (validItems.length === 0) return alert("Please add at least one fee component");

    try {
      await api.post("/fee-structure", {
        academicYear: activeAY,
        class: selectedClass._id,
        feeItems: validItems
      });
      alert("Annual Fee Structure saved successfully!");
      fetchYearlyData();
    } catch (e) { alert(e.response?.data?.message || "Save failed"); }
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <SectionTitle 
          title="Annual Fee Setup" 
          subtitle="Define total annual fees for each class. Students will choose their payment frequency." 
        />
        <div style={s.yearSelector}>
          <label style={s.label}>Academic Year</label>
          <select style={s.aySelect} value={activeAY} onChange={e => setActiveAY(e.target.value)}>
            {academicYears.map(y => <option key={y._id} value={y._id}>{y.year} {y.isActive ? '(Active)' : ''}</option>)}
          </select>
        </div>
      </div>

      {/* Fee Types Manager */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <i className="fa-solid fa-tags" style={{marginRight: '10px'}}></i>
          Fee Categories ({academicYears.find(y => y._id === activeAY)?.year})
        </div>
        <div style={s.cardBody}>
          <div style={s.typeList}>
            {feeTypes.map(t => (
              <span key={t._id} style={s.typeTag}>
                {t.name}
                <button onClick={() => handleDeleteFeeType(t._id)} style={s.tagDelete}>✕</button>
              </span>
            ))}
          </div>
          <div style={s.addTypeRow}>
            <input 
              style={s.input} 
              placeholder="e.g. Tuition Fee" 
              value={newFeeType} 
              onChange={e => setNewFeeType(e.target.value)} 
            />
            <button onClick={handleAddFeeType} style={s.btnNavy}>Add Category</button>
          </div>
        </div>
      </div>

      <div style={s.sectionLabel}>Select Class</div>
      <div style={s.classGrid}>
        {classes.map(c => {
          const structure = structures.find(st => st.class?._id === c._id);
          const isActive = selectedClass?._id === c._id;
          return (
            <button 
              key={c._id} 
              onClick={() => handleClassSelect(c)}
              style={{...s.classBtn, ...(isActive ? s.classBtnActive : {})}}
            >
              {c.name} - {c.section}
              {structure && <div style={s.classBadge}>₹{(structure.totalAnnualFee/1000).toFixed(1)}k</div>}
              {structure && <div style={s.greenDot}></div>}
            </button>
          );
        })}
      </div>

      {selectedClass && (
        <div style={{...s.card, animation: 'fadeInUp 0.4s ease'}}>
          <div style={s.cardHeader}>
             <i className="fa-solid fa-gears" style={{marginRight: '10px'}}></i>
             Annual Fee: Class {selectedClass.name} - {selectedClass.section}
          </div>
          <div style={s.cardBody}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Fee Component</th>
                  <th style={s.th}>Annual Amount (₹)</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {form.feeItems.map((item, idx) => (
                  <tr key={idx}>
                    <td style={s.td}>
                      <select 
                        style={s.input} 
                        value={item.feeType}
                        onChange={e => {
                          const items = [...form.feeItems];
                          items[idx].feeType = e.target.value;
                          setForm({...form, feeItems: items});
                        }}
                      >
                        <option value="">Select Category...</option>
                        {feeTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                    </td>
                    <td style={s.td}>
                      <input 
                        type="number" 
                        style={s.input} 
                        value={item.amount}
                        onChange={e => {
                          const items = [...form.feeItems];
                          items[idx].amount = e.target.value;
                          setForm({...form, feeItems: items});
                        }}
                      />
                    </td>
                    <td style={s.td}>
                      <button onClick={() => handleRemoveItem(idx)} style={s.btnDel}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleAddItem} style={s.btnAddItem}>+ Add Component</button>

            <div style={s.summaryCard}>
              <div style={s.sumRow}>
                <span style={s.sumLabel}>Total Annual Fee</span>
                <span style={s.sumVal}>₹{totalAnnual.toLocaleString()}</span>
              </div>
              <button onClick={handleSave} style={s.btnGold}>Save Annual Structure</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { maxWidth: "1200px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" },
  yearSelector: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "0.7rem", fontWeight: "800", color: "var(--gold)", textTransform: "uppercase" },
  aySelect: { padding: "10px 20px", borderRadius: "30px", border: "2px solid var(--gold)", color: "var(--navy)", fontWeight: "800" },
  card: { background: "var(--white)", borderRadius: "16px", boxShadow: "var(--shadow-md)", marginBottom: "2rem", overflow: "hidden", border: "1px solid var(--border)" },
  cardHeader: { background: "linear-gradient(135deg, var(--navy-dark), var(--navy))", color: "var(--white)", padding: "16px 24px", fontWeight: "700" },
  cardBody: { padding: "24px" },
  typeList: { display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" },
  typeTag: { background: "var(--gold-pale)", color: "var(--navy)", padding: "8px 16px", borderRadius: "30px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "10px", fontWeight: "700" },
  tagDelete: { background: "var(--gold)", color: "white", border: "none", width: "18px", height: "18px", borderRadius: "50%", cursor: "pointer", fontSize: "0.6rem" },
  addTypeRow: { display: "flex", gap: "12px" },
  input: { padding: "12px", borderRadius: "10px", border: "1.5px solid var(--border)", width: "100%", boxSizing: "border-box", fontWeight: "600" },
  btnNavy: { background: "var(--navy)", color: "var(--white)", border: "none", padding: "12px 24px", borderRadius: "30px", fontWeight: "700", cursor: "pointer" },
  sectionLabel: { fontSize: "0.75rem", fontWeight: "900", color: "var(--gold)", textTransform: "uppercase", marginBottom: "12px" },
  classGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px", marginBottom: "2rem" },
  classBtn: { position: "relative", padding: "16px", borderRadius: "12px", border: "1.5px solid var(--border)", background: "var(--white)", color: "var(--navy)", fontWeight: "800", cursor: "pointer", transition: "0.3s" },
  classBtnActive: { background: "var(--gold-pale)", borderColor: "var(--gold)" },
  classBadge: { background: "var(--navy)", color: "var(--gold-light)", fontSize: "0.6rem", padding: "2px 6px", borderRadius: "8px", marginTop: "4px" },
  greenDot: { position: "absolute", top: "8px", right: "8px", width: "8px", height: "8px", borderRadius: "50%", background: "#38a169" },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "20px" },
  th: { textAlign: "left", padding: "12px", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" },
  td: { padding: "12px", borderBottom: "1px solid var(--border)" },
  btnDel: { background: "transparent", border: "none", color: "#e53e3e", cursor: "pointer" },
  btnAddItem: { background: "rgba(14,107,107,0.05)", border: "1px dashed var(--border)", padding: "12px", width: "100%", borderRadius: "10px", color: "var(--navy)", fontWeight: "800", cursor: "pointer" },
  summaryCard: { marginTop: "32px", padding: "24px", background: "linear-gradient(135deg, var(--navy-dark), var(--navy))", borderRadius: "16px", color: "var(--white)" },
  sumRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  sumLabel: { fontSize: "1rem", fontWeight: "800" },
  sumVal: { fontSize: "1.8rem", fontWeight: "900", color: "var(--gold-light)" },
  btnGold: { width: "100%", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", padding: "16px", borderRadius: "50px", border: "none", fontWeight: "900", fontSize: "1rem", cursor: "pointer" }
};
