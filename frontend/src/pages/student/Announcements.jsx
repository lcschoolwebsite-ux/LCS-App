import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/announcements?audience=student")
      .then(r => setAnnouncements(r.data || []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={s.title}>Notice Board</h1>
      <div style={s.list}>
        {loading && <div style={s.empty}>Loading notices...</div>}
        {!loading && announcements.length === 0 && <div style={s.empty}>No notices have been posted yet.</div>}
        {!loading && announcements.map(a => (
          <div key={a._id} style={{ ...s.card, borderLeft: a.pinned ? "4px solid #f59e0b" : "4px solid #e2e8f0" }}>
            <div style={s.cardHeader}>
              <span style={s.date}>{new Date(a.createdAt).toLocaleDateString()}</span>
              {a.pinned && <span style={s.pinnedBadge}>Pinned</span>}
            </div>
            <div style={s.cardContent}>{formatNoticeText(a)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatNoticeText(announcement) {
  const title = String(announcement.title || "").trim();
  const content = String(announcement.content || "").trim();
  return [title, content].filter(Boolean).join("\n");
}

const s = {
  title: { fontSize: "1.75rem", fontWeight: "800", color: "#1e293b", marginBottom: "2rem" },
  list: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  empty: { padding: "48px", textAlign: "center", background: "#fff", borderRadius: "12px", color: "#94a3b8", border: "1px dashed #e2e8f0", fontWeight: "700" },
  card: { background: "#fff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" },
  date: { fontSize: "0.75rem", color: "#94a3b8" },
  pinnedBadge: { fontSize: "0.75rem", fontWeight: "700", color: "#d97706" },
  cardContent: { fontSize: "0.95rem", color: "#475569", lineHeight: "1.7", margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontWeight: "600" }
};
