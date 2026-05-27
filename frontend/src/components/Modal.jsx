import React, { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, subtitle, children, footer, maxWidth = "640px" }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{ ...s.modal, maxWidth }} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <div>
            <h2 style={s.title}>{title}</h2>
            {subtitle && <p style={s.subtitle}>{subtitle}</p>}
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.body}>
          {children}
        </div>
        {footer && (
          <div style={s.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(6,30,30,0.75)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 99999, padding: "20px"
  },
  modal: {
    background: "var(--white)",
    borderRadius: "20px",
    width: "100%",
    boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
    animation: "fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
    display: "flex", flexDirection: "column",
    maxHeight: "90vh"
  },
  header: {
    background: "linear-gradient(135deg, var(--navy-dark), var(--navy))",
    padding: "24px 28px",
    borderRadius: "20px 20px 0 0",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start"
  },
  title: {
    fontFamily: "var(--font-heading)",
    color: "var(--white)",
    fontSize: "1.2rem",
    margin: "0 0 4px 0"
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "0.82rem",
    margin: 0
  },
  closeBtn: {
    background: "rgba(255,255,255,0.15)",
    color: "var(--white)",
    width: "32px", height: "32px",
    borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "var(--transition)",
    fontSize: "0.9rem"
  },
  body: {
    padding: "28px",
    overflowY: "auto"
  },
  footer: {
    padding: "20px 28px",
    borderTop: "1px solid var(--border)",
    background: "#fcfcfc",
    borderRadius: "0 0 20px 20px",
    display: "flex",
    justifyContent: "flex-end"
  }
};
