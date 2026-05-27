import React from 'react';

export default function Badge({ type, children }) {
  const getStyles = () => {
    switch (type?.toLowerCase()) {
      case 'paid':
      case 'success':
      case 'present':
        return { bg: "var(--success-bg)", text: "var(--success-text)", border: "var(--success-text)" };
      case 'due':
      case 'unpaid':
      case 'absent':
      case 'fail':
      case 'error':
        return { bg: "var(--danger-bg)", text: "var(--danger-text)", border: "var(--danger-text)" };
      case 'gold':
      case 'pending':
        return { bg: "var(--gold-pale)", text: "var(--gold-light)", border: "var(--gold-light)" };
      default:
        return { bg: "var(--light-bg)", text: "var(--text-muted)", border: "var(--text-muted)" };
    }
  };

  const st = getStyles();

  return (
    <span style={{
      background: st.bg,
      color: st.text,
      border: `1px solid ${st.border}`,
      padding: "3px 12px",
      borderRadius: "20px",
      fontSize: "0.72rem",
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      display: "inline-block",
      whiteSpace: "nowrap"
    }}>
      {children}
    </span>
  );
}
