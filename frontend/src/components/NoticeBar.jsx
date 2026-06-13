import { useEffect, useState } from "react";
import api from "../api/axios";

const DEFAULT_NOTICE = "Welcome to LCS Portal.\nPlease ensure all mid-term marks are submitted by 15th October.";

export default function NoticeBar({ notices }) {
  const [loadedNotice, setLoadedNotice] = useState("");

  useEffect(() => {
    if (Array.isArray(notices)) {
      setLoadedNotice(String(notices.find(Boolean) || ""));
      return;
    }

    let active = true;

    const loadNotices = async () => {
      try {
        const { data } = await api.get("/announcements");
        if (!active) return;
        const primaryNotice = (data || []).find((notice) => String(notice?.content || "").trim());
        const title = String(primaryNotice?.title || "").trim();
        const content = String(primaryNotice?.content || "").trim();
        setLoadedNotice([title, content].filter(Boolean).join("\n"));
      } catch {
        if (active) setLoadedNotice("");
      }
    };

    loadNotices();

    return () => {
      active = false;
    };
  }, [notices]);

  const visibleNotice = (loadedNotice && String(loadedNotice).trim()) || DEFAULT_NOTICE;

  return (
    <div style={s.wrapper} role="status" aria-live="polite">
      <div style={s.pill}>NOTICE</div>
      <div style={s.noticeWrap}>
        <div style={s.noticeLine}>
          {visibleNotice}
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
