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
      background: "var(--white)",
      padding: "24px 28px",
      borderRadius: "16px",
      borderTop: `4px solid ${getBorderColor()}`,
      boxShadow: "var(--shadow-md)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      cursor: "default",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    },
    topRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    iconWrap: {
      width: "48px", height: "48px", borderRadius: "50%",
      background: getIconBg(), color: getBorderColor(),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1.2rem"
    },
    menuIcon: { color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" },
    value: { fontFamily: "var(--font-counter)", fontSize: "2.8rem", color: "var(--navy)", margin: 0, lineHeight: 1 },
    title: { fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0, fontWeight: "700" },
    bottomRow: { display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "auto" },
    trendIcon: { color: isPositive ? "var(--success-text)" : "var(--danger-text)", fontSize: "0.9rem" },
    trendLabel: { fontSize: "0.8rem", color: "var(--text-muted)" }
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
