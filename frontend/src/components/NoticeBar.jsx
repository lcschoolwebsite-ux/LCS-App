import { useEffect, useState } from "react";
import api from "../api/axios";

const DEFAULT_NOTICE = "Welcome to the Loretto Central School Management System.\nPlease ensure all mid-term marks are submitted by 15th October.";

export default function NoticeBar({ notices }) {
  const [loadedNotices, setLoadedNotices] = useState([]);

  useEffect(() => {
    if (Array.isArray(notices)) {
      setLoadedNotices(notices);
      return;
    }

    let active = true;

    const loadNotices = async () => {
      try {
        const { data } = await api.get("/announcements");
        if (!active) return;
        setLoadedNotices((data || []).slice(0, 3).map((notice) => notice?.content || "").filter(Boolean));
      } catch {
        if (active) setLoadedNotices([]);
      }
    };

    loadNotices();

    return () => {
      active = false;
    };
  }, [notices]);

  const visibleNotices = (loadedNotices?.length ? loadedNotices : [DEFAULT_NOTICE]).flatMap((notice) =>
    String(notice)
      .split(/\r?\n/)
      .map((line) => {
        const text = line.trimEnd();
        return text.length > 0 ? text : "\u00A0";
      })
  );

  return (
    <div style={s.wrapper} role="status" aria-live="polite">
      <div style={s.pill}>NOTICE</div>
      <div style={s.noticeWrap}>
        {visibleNotices.map((notice, index) => (
          <div key={`${notice}-${index}`} style={s.noticeLine}>
            {notice}
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    background: "var(--navy)",
    padding: "8px 32px",
    display: "flex",
    alignItems: "flex-start",
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
  noticeWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0
  },
  noticeLine: {
    color: "var(--white)",
    fontSize: "0.85rem",
    fontWeight: "600",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    lineHeight: 1.45
  }
};
