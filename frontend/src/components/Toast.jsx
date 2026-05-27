import { useState, useEffect } from "react";

export default function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      ...s.toast,
      borderLeft: `4px solid ${type === "info" ? "#4f46e5" : "#10b981"}`
    }}>
      <div style={s.content}>{message}</div>
      <button style={s.close} onClick={onClose}>&times;</button>
    </div>
  );
}

const s = {
  toast: {
    position: "fixed", bottom: "2rem", right: "2rem",
    background: "#fff", padding: "1rem 1.5rem", borderRadius: "12px",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
    display: "flex", alignItems: "center", gap: "1rem", zIndex: 9999,
    minWidth: "300px", animation: "slideIn 0.3s ease-out"
  },
  content: { fontSize: "0.9rem", fontWeight: "600", color: "#1e293b" },
  close: { background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem", color: "#94a3b8" }
};

// Add global animation style
const style = document.createElement("style");
style.innerHTML = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);
