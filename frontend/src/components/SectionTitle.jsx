import React from 'react';

export default function SectionTitle({ title, subtitle }) {
  return (
    <div style={s.wrapper}>
      <h2 style={s.title}>{title}</h2>
      {subtitle && <p style={s.subtitle}>{subtitle}</p>}
      <div style={s.divider}></div>
    </div>
  );
}

const s = {
  wrapper: {
    marginBottom: "2rem",
    animation: "fadeInUp 0.6s ease forwards"
  },
  title: {
    fontFamily: "var(--font-heading)",
    color: "var(--navy)",
    fontWeight: "700",
    fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
    margin: "0 0 0.5rem 0"
  },
  subtitle: {
    color: "var(--text-muted)",
    fontSize: "0.95rem",
    maxWidth: "560px",
    margin: "0 0 1rem 0"
  },
  divider: {
    width: "56px",
    height: "3px",
    background: "linear-gradient(90deg, var(--gold), var(--gold-light))",
    borderRadius: "2px"
  }
};
