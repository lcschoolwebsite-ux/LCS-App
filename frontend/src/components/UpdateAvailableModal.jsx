export default function UpdateAvailableModal({ update, onClose }) {
  if (!update) return null;

  const openDownload = () => {
    if (update.apkUrl) {
      window.open(update.apkUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div style={s.overlay} role="dialog" aria-modal="true" aria-labelledby="apk-update-title">
      <div style={s.card}>
        <div style={s.badge}>New APK Available</div>
        <h2 id="apk-update-title" style={s.title}>{update.title || "Update available"}</h2>
        <p style={s.body}>
          {update.versionName ? `Version ${update.versionName} is ready.` : "A newer APK is available."}
          {update.notes ? ` ${update.notes}` : ""}
        </p>
        <div style={s.actions}>
          <button type="button" style={s.secondaryBtn} onClick={onClose}>
            Later
          </button>
          <button type="button" style={s.primaryBtn} onClick={openDownload} disabled={!update.apkUrl}>
            Download APK
          </button>
        </div>
        {!update.apkUrl && (
          <p style={s.helper}>
            Set `VITE_APK_DOWNLOAD_URL` to your GitHub release or raw file link.
          </p>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 12, 12, 0.7)",
    zIndex: 10020,
    display: "grid",
    placeItems: "center",
    padding: "20px"
  },
  card: {
    width: "min(520px, 100%)",
    borderRadius: "24px",
    background: "linear-gradient(180deg, #ffffff 0%, #f8f4e8 100%)",
    padding: "24px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.35)"
  },
  badge: {
    display: "inline-flex",
    background: "var(--gold)",
    color: "var(--navy-dark)",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "0.7rem",
    fontWeight: "900",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "14px"
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    color: "var(--navy)"
  },
  body: {
    margin: "12px 0 18px",
    color: "var(--text)",
    lineHeight: 1.7
  },
  actions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    flexWrap: "wrap"
  },
  secondaryBtn: {
    borderRadius: "999px",
    padding: "10px 16px",
    border: "1px solid var(--border)",
    background: "var(--white)",
    color: "var(--navy)",
    fontWeight: "800"
  },
  primaryBtn: {
    borderRadius: "999px",
    padding: "10px 16px",
    border: "none",
    background: "linear-gradient(135deg, var(--navy), var(--navy-dark))",
    color: "var(--white)",
    fontWeight: "800"
  },
  helper: {
    margin: "12px 0 0",
    fontSize: "0.82rem",
    color: "var(--text-muted)"
  }
};
