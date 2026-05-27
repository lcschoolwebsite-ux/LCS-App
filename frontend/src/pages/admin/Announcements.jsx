import { useState, useEffect } from "react";
import api from "../../api/axios";
import SectionTitle from "../../components/SectionTitle";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [formData, setFormData] = useState({ title: "", content: "", audience: "all", pinned: false });
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/announcements");
      setAnnouncements(data);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/announcements", formData);
      setFormData({ title: "", content: "", audience: "all", pinned: false });
      await fetchAnnouncements();
      alert("Announcement published!");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to publish announcement");
    }
  };

  const handlePin = async (id) => {
    try {
      await api.patch(`/announcements/${id}/pin`);
      await fetchAnnouncements();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to update announcement");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        await api.delete(`/announcements/${id}`);
        await fetchAnnouncements();
      } catch (e) {
        alert(e.response?.data?.message || "Failed to delete announcement");
      }
    }
  };

  const pinnedList = announcements.filter(a => a.pinned);
  const regularList = announcements.filter(a => !a.pinned);
  const audienceCounts = announcements.reduce((counts, ann) => {
    const key = ann.audience || "all";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, { all: 0, student: 0, teacher: 0 });

  return (
    <div style={s.page}>
      
      {/* Create Announcement Form */}
      <div style={s.createContainer}>
        <div style={s.createLeft}>
          <h2 style={s.createTitle}>Publish Notice</h2>
          <p style={s.createSub}>Communicate instantly with students and teachers.</p>
          <ul style={s.checklist}>
            <li><i className="fa-solid fa-check-circle" style={s.checkIcon}></i> Clear, concise titles</li>
            <li><i className="fa-solid fa-check-circle" style={s.checkIcon}></i> Verify dates before posting</li>
            <li><i className="fa-solid fa-check-circle" style={s.checkIcon}></i> Pin critical updates</li>
          </ul>
        </div>
        
        <form style={s.createRight} onSubmit={handleSubmit}>
          <div style={s.formRow}>
            <div style={{flex: 1}}>
              <label style={s.label}>Announcement Title</label>
              <input type="text" style={s.input} placeholder="E.g., Annual Sports Day" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} required />
            </div>
          </div>
          <div style={s.formRow}>
            <div style={{flex: 1}}>
              <label style={s.label}>Audience</label>
              <select style={s.input} value={formData.audience} onChange={e=>setFormData({...formData, audience: e.target.value})}>
                <option value="all">Everyone</option>
                <option value="teacher">Teachers</option>
                <option value="student">Students</option>
              </select>
            </div>
          </div>
          <div style={s.formRow}>
            <div style={{flex: 1}}>
              <label style={s.label}>Details / Excerpt</label>
              <textarea style={{...s.input, height: '100px', resize: 'none'}} placeholder="Enter the announcement details..." value={formData.content} onChange={e=>setFormData({...formData, content: e.target.value})} required></textarea>
            </div>
          </div>
          <div style={{...s.formRow, alignItems: 'center', justifyContent: 'space-between'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: 'var(--navy)'}}>
              <input type="checkbox" checked={formData.pinned} onChange={e=>setFormData({...formData, pinned: e.target.checked})} style={{width: '18px', height: '18px'}} />
              Pin to top
            </label>
            <button type="submit" style={s.submitBtn}>Publish Now</button>
          </div>
        </form>
      </div>

      <SectionTitle title="School Noticeboard" />

      <div style={s.summaryGrid}>
        <div style={s.summaryItem}>
          <span style={s.summaryLabel}>Total Published</span>
          <strong style={s.summaryValue}>{announcements.length}</strong>
        </div>
        <div style={s.summaryItem}>
          <span style={s.summaryLabel}>For Everyone</span>
          <strong style={s.summaryValue}>{audienceCounts.all || 0}</strong>
        </div>
        <div style={s.summaryItem}>
          <span style={s.summaryLabel}>For Students</span>
          <strong style={s.summaryValue}>{audienceCounts.student || 0}</strong>
        </div>
        <div style={s.summaryItem}>
          <span style={s.summaryLabel}>For Teachers</span>
          <strong style={s.summaryValue}>{audienceCounts.teacher || 0}</strong>
        </div>
      </div>
      
      <div style={s.newsGrid}>
        {loading && <div style={s.empty}>Loading announcements...</div>}

        {/* Render Pinned first */}
        {pinnedList.map(ann => (
          <div key={ann._id} style={{...s.newsCard, border: '2px solid var(--gold)'}}>
            <div style={{...s.newsTop, background: `linear-gradient(135deg, var(--gold), var(--navy))`}}></div>
            <div style={s.pinnedTag}>📌 Pinned</div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px', marginTop:'24px'}}>
              <span style={s.newsDate}>{new Date(ann.createdAt).toLocaleDateString()}</span>
              <span style={s.newsCat}>{getAudienceLabel(ann)}</span>
            </div>
            <h3 style={s.newsTitle}>{ann.title}</h3>
            <p style={s.newsExcerpt}>{ann.content}</p>
            <div style={s.newsActions}>
              <button style={s.actionBtnGold} onClick={()=>handlePin(ann._id)}><i className="fa-solid fa-star"></i></button>
              <button style={s.actionBtnRed} onClick={()=>handleDelete(ann._id)}><i className="fa-solid fa-trash"></i></button>
            </div>
          </div>
        ))}
        
        {/* Render Regular */}
        {regularList.map(ann => (
          <div key={ann._id} style={s.newsCard}>
            <div style={{...s.newsTop, background: `linear-gradient(135deg, var(--navy), #333)`}}></div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px', marginTop:'16px'}}>
              <span style={s.newsDate}>{new Date(ann.createdAt).toLocaleDateString()}</span>
              <span style={s.newsCat}>{getAudienceLabel(ann)}</span>
            </div>
            <h3 style={s.newsTitle}>{ann.title}</h3>
            <p style={s.newsExcerpt}>{ann.content}</p>
            <div style={s.newsActions}>
              <button style={s.actionBtnNavy} onClick={()=>handlePin(ann._id)}><i className="fa-regular fa-star"></i></button>
              <button style={s.actionBtnRed} onClick={()=>handleDelete(ann._id)}><i className="fa-solid fa-trash"></i></button>
            </div>
          </div>
        ))}
        {!loading && announcements.length === 0 && <div style={s.empty}>No announcements yet.</div>}
      </div>

    </div>
  );
}

function getAudienceLabel(announcement) {
  const labels = {
    all: "Everyone",
    student: "Students",
    teacher: "Teachers"
  };
  const baseLabel = labels[announcement.audience] || "Everyone";
  const targetParts = [];

  if (announcement.class) {
    targetParts.push(`Class ${announcement.class.name || ""}${announcement.class.section || ""}`.trim());
  }

  if (announcement.academicYear) {
    targetParts.push(announcement.academicYear.year || announcement.academicYear.name);
  }

  return targetParts.length ? `${baseLabel} - ${targetParts.join(", ")}` : baseLabel;
}

const s = {
  page: { width: "100%" },
  
  createContainer: {
    display: "flex", background: "var(--white)", borderRadius: "20px", overflow: "hidden",
    boxShadow: "var(--shadow-md)", marginBottom: "40px", border: "1px solid var(--border)"
  },
  createLeft: {
    width: "35%", background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
    padding: "40px", color: "var(--navy-dark)", display: "flex", flexDirection: "column",
    justifyContent: "center", position: "relative", overflow: "hidden"
  },
  createTitle: { fontFamily: "var(--font-heading)", fontSize: "2rem", margin: "0 0 8px 0" },
  createSub: { fontSize: "0.95rem", fontWeight: "600", opacity: 0.8, marginBottom: "32px" },
  checklist: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" },
  checkIcon: { color: "var(--white)", marginRight: "8px", fontSize: "1.1rem" },
  
  createRight: { width: "65%", padding: "40px" },
  formRow: { display: "flex", gap: "20px", marginBottom: "20px" },
  label: { display: "block", color: "var(--gold)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "800", marginBottom: "8px" },
  input: {
    width: "100%", padding: "12px 14px", borderRadius: "11px", border: "1.5px solid var(--border)",
    fontFamily: "var(--font-body)", fontSize: "0.88rem", transition: "var(--transition)"
  },
  submitBtn: {
    background: "linear-gradient(135deg, var(--navy), var(--navy-dark))", color: "var(--white)",
    padding: "14px 32px", borderRadius: "30px", fontWeight: "700", border: "none", cursor: "pointer",
    boxShadow: "var(--shadow-sm)", transition: "var(--transition)"
  },

  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" },
  summaryItem: {
    background: "var(--white)", border: "1px solid var(--border)", borderRadius: "12px",
    padding: "16px 18px", boxShadow: "var(--shadow-sm)", display: "flex",
    alignItems: "center", justifyContent: "space-between", gap: "12px"
  },
  summaryLabel: { color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" },
  summaryValue: { color: "var(--navy)", fontFamily: "var(--font-counter)", fontSize: "1.6rem", lineHeight: 1 },

  newsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" },
  newsCard: {
    background: "var(--white)", borderRadius: "16px", padding: "0 24px 24px 24px",
    position: "relative", overflow: "hidden", boxShadow: "var(--shadow-sm)",
    transition: "var(--transition)", border: "1px solid var(--border)", display: "flex", flexDirection: "column"
  },
  newsTop: { position: "absolute", top: 0, left: 0, right: 0, height: "80px", opacity: 0.1 },
  pinnedTag: { position: "absolute", top: "12px", right: "12px", background: "var(--gold)", color: "var(--navy-dark)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "800", boxShadow: "0 2px 8px rgba(200,150,12,0.4)" },
  
  newsDate: { background: "var(--gold)", color: "var(--navy-dark)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "800", zIndex: 1 },
  newsCat: { background: "var(--light-bg)", color: "var(--text-muted)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700", border: "1px solid var(--border)", zIndex: 1 },
  newsTitle: { fontFamily: "var(--font-heading)", color: "var(--navy)", fontSize: "1.3rem", margin: "0 0 12px 0", zIndex: 1 },
  newsExcerpt: { color: "var(--text-muted)", fontSize: "0.9rem", margin: "0 0 24px 0", lineHeight: 1.5, flex: 1, zIndex: 1 },
  
  newsActions: { display: "flex", gap: "12px", zIndex: 1 },
  empty: { padding: "24px", background: "var(--white)", border: "1px dashed var(--border)", borderRadius: "12px", color: "var(--text-muted)", fontWeight: "800", textAlign: "center" },
  actionBtnGold: { width: "36px", height: "36px", borderRadius: "50%", background: "var(--gold-pale)", color: "var(--gold)", border: "none", cursor: "pointer" },
  actionBtnNavy: { width: "36px", height: "36px", borderRadius: "50%", background: "rgba(14,107,107,0.1)", color: "var(--navy)", border: "none", cursor: "pointer" },
  actionBtnRed: { width: "36px", height: "36px", borderRadius: "50%", background: "var(--danger-bg)", color: "var(--danger-text)", border: "none", cursor: "pointer" }
};
