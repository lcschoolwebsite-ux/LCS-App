import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    api.get("/announcements").then(r => setAnnouncements(r.data));
  }, []);

  return (
    <div>
      <h1 style={s.title}>Notice Board</h1>
      <div style={s.list}>
        {announcements.map(a => (
          <div key={a._id} style={{ ...s.card, borderLeft: a.pinned ? "4px solid #f59e0b" : "4px solid #e2e8f0" }}>
            <div style={s.cardHeader}>
              <span style={s.date}>{new Date(a.createdAt).toLocaleDateString()}</span>
              {a.pinned && <span style={s.pinnedBadge}>📌 Pinned</span>}
            </div>
            <h3 style={s.cardTitle}>{a.title}</h3>
            <p style={s.cardContent}>{a.content}</p>
            <p style={s.author}>- {a.createdBy?.name} (Admin)</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  title: { fontSize: "1.75rem", fontWeight: "800", color: "#1e293b", marginBottom: "2rem" },
  list: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  card: { background: "#fff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" },
  date: { fontSize: "0.75rem", color: "#94a3b8" },
  pinnedBadge: { fontSize: "0.75rem", fontWeight: "700", color: "#d97706" },
  cardTitle: { fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.5rem 0" },
  cardContent: { fontSize: "0.95rem", color: "#475569", lineHeight: "1.6", margin: 0 },
  author: { fontSize: "0.8rem", color: "#94a3b8", marginTop: "1rem", fontWeight: "600" }
};
