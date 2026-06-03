import { useEffect, useState } from "react";
import api from "../../api/axios";
import Table from "../../components/Table";

export default function StudentLogins() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/student-logins");
      setLogs(data);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to load student login history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Student Login History</h1>
          <p style={s.sub}>See which student logged in and when. Records expire automatically after 7 days.</p>
        </div>
        <button style={s.btnPrimary} onClick={fetchLogs}>
          <i className="fa-solid fa-rotate-right" style={{ marginRight: "8px" }}></i>
          Refresh
        </button>
      </div>

      <Table
        loading={loading}
        headers={["Student", "SAT Code", "Class", "Academic Year", "Login Time"]}
        data={logs}
        emptyMessage="No student logins recorded in the last 7 days."
        renderRow={(log) => (
          <>
            <td style={s.td}>
              <strong>{log.studentName}</strong>
              <div style={s.meta}>ID: {log.studentId}</div>
            </td>
            <td style={s.td}>{log.satCode}</td>
            <td style={s.td}>{log.className || "-"}</td>
            <td style={s.td}>{log.academicYear || "-"}</td>
            <td style={s.td}>
              <div style={s.time}>{new Date(log.createdAt).toLocaleString()}</div>
            </td>
          </>
        )}
      />
    </div>
  );
}

const s = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "2.5rem", flexWrap: "wrap" },
  title: { fontSize: "1.75rem", fontWeight: "800", color: "var(--navy)", margin: 0, fontFamily: "var(--font-heading)" },
  sub: { fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.4rem", maxWidth: "720px" },
  btnPrimary: { background: "linear-gradient(135deg, var(--navy), var(--navy-dark))", color: "var(--white)", border: "none", padding: "12px 22px", borderRadius: "30px", fontWeight: "700", cursor: "pointer", boxShadow: "var(--shadow-md)" },
  td: { padding: "16px 20px", fontSize: "0.95rem", color: "var(--text)", borderBottom: "1px solid var(--border)", verticalAlign: "top" },
  meta: { marginTop: "4px", fontSize: "0.72rem", color: "var(--text-muted)" },
  time: { fontWeight: "700", color: "var(--navy)" }
};
