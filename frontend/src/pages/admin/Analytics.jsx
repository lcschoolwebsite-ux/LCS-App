import { useState, useEffect } from "react";
import api from "../../api/axios";
import StatCard from "../../components/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [feeTrend, setFeeTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ovRes, trendRes] = await Promise.all([
          api.get("/analytics/overview"),
          api.get("/analytics/fee-trend")
        ]);
        setData(ovRes.data);
        setFeeTrend(trendRes.data);
      } catch (e) {
        console.error("Analytics error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading Analytics...</div>;

  return (
    <div>
      <h1 style={s.title}>Admin Analytics</h1>
      <p style={s.sub}>Real-time insights into school performance.</p>

      <div style={s.statsGrid}>
        <StatCard title="Total Students" value={data?.totalStudents} icon="👥" color="#4f46e5" />
        <StatCard title="Total Teachers" value={data?.totalTeachers} icon="👩‍🏫" color="#10b981" />
        <StatCard title="Fees Collected" value={`${data?.feeStats?.percentageCollected.toFixed(1)}%`} icon="💰" color="#f59e0b" />
        <StatCard title="Today's Attendance" value="94%" icon="📅" color="#ef4444" />
      </div>

      <div style={s.chartSection}>
        <h3 style={s.chartTitle}>Fee Collection Trend (Monthly)</h3>
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={feeTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dx={-10} />
              <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="collected" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const s = {
  title: { fontSize: "1.75rem", fontWeight: "800", color: "#1e293b", margin: 0 },
  sub: { fontSize: "0.9rem", color: "#64748b", marginTop: "0.4rem", marginBottom: "2.5rem" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", marginBottom: "2.5rem" },
  chartSection: { background: "#fff", padding: "2rem", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  chartTitle: { fontSize: "1.1rem", fontWeight: "700", color: "#1e293b", marginBottom: "2rem" }
};
