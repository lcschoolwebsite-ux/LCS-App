import React from "react";

export default function StatCard({ title, value, icon, color = "navy", trend, trendLabel = "vs last month" }) {
  // Determine border color based on prop
  const getBorderColor = () => {
    if (color === "gold") return "var(--gold)";
    if (color === "teal") return "var(--navy-dark)";
    if (color === "red") return "var(--danger-text)";
    return "var(--navy)";
  };

  const getIconBg = () => {
    if (color === "gold") return "rgba(200, 150, 12, 0.1)";
    if (color === "teal") return "rgba(14, 107, 107, 0.1)";
    if (color === "red") return "var(--danger-bg)";
    return "rgba(14, 107, 107, 0.1)";
  };

  const isPositive = trend && trend.startsWith("+");

  const s = {
    card: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.99))",
      padding: "28px 32px",
      borderRadius: "22px",
      borderTop: `8px solid ${getBorderColor()}`,
      boxShadow: "0 12px 36px rgba(14,107,107,0.12)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      cursor: "default",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: "1.2rem",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(200,150,12,0.1)",
      overflow: "hidden"
    },
    topRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    iconWrap: {
      width: "56px", height: "56px", borderRadius: "50%",
      background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95))",
      color: getBorderColor(),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1.4rem",
      border: "2px solid rgba(200,150,12,0.15)",
      boxShadow: "0 4px 16px rgba(14,107,107,0.1)"
    },
    menuIcon: { color: "rgba(14,107,107,0.5)", cursor: "pointer", fontSize: "1.2rem", padding: "8px", borderRadius: "8px", transition: "all 0.3s ease" },
    value: { fontFamily: "var(--font-counter)", fontSize: "3.2rem", color: "var(--navy-dark)", margin: 0, lineHeight: 1, fontWeight: "400", letterSpacing: "-0.02em" },
    title: { fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, fontWeight: "800", opacity: 0.8 },
    bottomRow: { display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "auto", padding: "12px 16px", background: "rgba(14,107,107,0.03)", borderRadius: "14px", border: "1px solid rgba(200,150,12,0.1)" },
    trendIcon: { color: isPositive ? "var(--success-text)" : "var(--danger-text)", fontSize: "1rem", fontWeight: "800" },
    trendLabel: { fontSize: "0.9rem", color: "var(--navy)", fontWeight: "600", opacity: 0.7 }
  };

  return (
    <div style={s.card} className="stat-card" onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-6px)";
      e.currentTarget.style.boxShadow = "var(--shadow-lg)";
    }} onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
    }}>
      <div style={s.topRow}>
        <div style={s.iconWrap}>{icon}</div>
        <div style={s.menuIcon}>⋯</div>
      </div>
      <div>
        <h3 style={s.value}>{value}</h3>
        <p style={s.title}>{title}</p>
      </div>
      {trend && (
        <div style={s.bottomRow}>
          <span style={s.trendIcon}>{isPositive ? "▲" : "▼"}</span>
          <span style={{ color: isPositive ? "var(--success-text)" : "var(--danger-text)", fontSize: "0.85rem", fontWeight: "700" }}>{trend}</span>
          <span style={s.trendLabel}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
