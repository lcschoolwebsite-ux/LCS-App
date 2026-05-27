import React from 'react';

export default function NoticeBar({ notices = [] }) {
  if (!notices || notices.length === 0) {
    notices = ["Welcome to the Loretto Central School Management System. Please ensure all mid-term marks are submitted by 15th October."];
  }

  return (
    <div style={s.wrapper}>
      <div style={s.pill}>NOTICE</div>
      <div style={s.tickerWrap}>
        <div style={s.ticker}>
          {notices.join(" ✦ ")}
        </div>
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    background: "var(--navy)",
    padding: "8px 32px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    overflow: "hidden",
    position: "relative",
    zIndex: 80,
    borderBottom: "1px solid rgba(255,255,255,0.1)"
  },
  pill: {
    background: "var(--gold-light)",
    color: "var(--navy-dark)",
    padding: "4px 12px",
    borderRadius: "3px",
    fontWeight: "800",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
    zIndex: 2,
    boxShadow: "0 0 10px rgba(0,0,0,0.2)"
  },
  tickerWrap: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
    maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
    WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)"
  },
  ticker: {
    color: "var(--white)",
    fontSize: "0.85rem",
    fontWeight: "600",
    whiteSpace: "nowrap",
    animation: "ticker 28s linear infinite",
    paddingLeft: "100%"
  }
};
