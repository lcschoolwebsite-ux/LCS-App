import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { isNativeAndroidApp } from "../services/nativeBridge";

export default function InstallPWA() {
  const [prompt, setPrompt] = useState(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setPrompt(e);
    };

    const onAppInstalled = () => {
      setPrompt(null);
      setShowIOSGuide(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const isStudentPortal = location.pathname.startsWith("/student");

  if (isNativeAndroidApp()) return null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;

  // Already installed — show nothing
  if (isInStandaloneMode) return null;

  const shouldShowBanner = isStudentPortal;

  if (!shouldShowBanner) return null;

  const primaryAction = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!prompt) {
      setShowIOSGuide(true);
      return;
    }

    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
  };

  const bannerLabel = isIOS ? "Add to Home Screen" : prompt ? "Install App" : "Install Portal";
  const bannerNote = isIOS
    ? "Use Safari's share menu to save the student portal like an app."
    : "Install the student portal for faster access and push notifications.";

  return (
    <>
      <button
        type="button"
        onClick={primaryAction}
        style={s.banner}
        aria-label="Install student portal app"
      >
        <div style={s.badge}>Student Portal</div>
        <div style={s.copy}>
          <div style={s.title}>{bannerLabel}</div>
          <div style={s.note}>{bannerNote}</div>
        </div>
        <div style={s.action}>
          <span style={s.actionText}>{isIOS ? "Open guide" : prompt ? "Install now" : "Learn how"}</span>
          <i className="fa-solid fa-arrow-right" style={s.arrow} />
        </div>
      </button>

      {showIOSGuide && (
        <div style={s.overlay}>
          <div style={s.sheet}>
            <div style={s.sheetHead}>
              <div>
                <div style={s.sheetKicker}>Student Portal</div>
                <h3 style={s.sheetTitle}>Install on iPhone</h3>
              </div>
              <button onClick={() => setShowIOSGuide(false)} style={s.closeBtn} aria-label="Close install guide">
                ×
              </button>
            </div>
            <div style={s.steps}>
              <p style={s.step}><strong>1.</strong> Tap the <strong>Share</strong> button in Safari.</p>
              <p style={s.step}><strong>2.</strong> Scroll and tap <strong>Add to Home Screen</strong>.</p>
              <p style={s.step}><strong>3.</strong> Tap <strong>Add</strong> to save it like an app.</p>
            </div>
            <button onClick={() => setShowIOSGuide(false)} style={s.doneBtn}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const s = {
  banner: {
    position: "fixed",
    left: "50%",
    bottom: "16px",
    transform: "translateX(-50%)",
    width: "min(760px, calc(100vw - 24px))",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 16px",
    borderRadius: "18px",
    border: "1px solid rgba(200,150,12,0.35)",
    background: "linear-gradient(135deg, rgba(5,26,26,0.96), rgba(9,79,79,0.96))",
    color: "var(--white)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.26)",
    zIndex: 10001,
    cursor: "pointer",
    textAlign: "left",
    backdropFilter: "blur(10px)"
  },
  badge: {
    flex: "0 0 auto",
    background: "var(--gold)",
    color: "var(--navy-dark)",
    fontSize: "0.68rem",
    fontWeight: "900",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "6px 10px",
    borderRadius: "999px"
  },
  copy: { flex: 1, minWidth: 0 },
  title: {
    fontSize: "0.98rem",
    fontWeight: "900",
    marginBottom: "3px",
    color: "var(--white)"
  },
  note: {
    fontSize: "0.82rem",
    color: "rgba(255,255,255,0.78)",
    lineHeight: 1.35
  },
  action: {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "999px",
    padding: "10px 14px"
  },
  actionText: {
    fontSize: "0.82rem",
    fontWeight: "800",
    color: "var(--gold-light)"
  },
  arrow: { fontSize: "0.8rem", color: "var(--gold-light)" },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 12, 12, 0.62)",
    zIndex: 10002,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "16px"
  },
  sheet: {
    width: "min(560px, 100%)",
    background: "var(--white)",
    borderRadius: "24px 24px 16px 16px",
    padding: "18px",
    boxShadow: "0 24px 60px rgba(0,0,0,0.3)"
  },
  sheetHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "14px"
  },
  sheetKicker: {
    color: "var(--gold)",
    fontSize: "0.7rem",
    fontWeight: "900",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "4px"
  },
  sheetTitle: {
    margin: 0,
    color: "var(--navy)",
    fontSize: "1.2rem",
    fontWeight: "900"
  },
  closeBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    background: "var(--light-bg)",
    color: "var(--navy)",
    fontSize: "1.2rem",
    fontWeight: "900",
    cursor: "pointer"
  },
  steps: {
    display: "grid",
    gap: "10px",
    marginBottom: "16px"
  },
  step: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: "14px",
    background: "var(--light-bg)",
    color: "var(--text)",
    lineHeight: 1.5
  },
  doneBtn: {
    width: "100%",
    padding: "13px 16px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, var(--navy), var(--navy-dark))",
    color: "var(--white)",
    fontWeight: "900",
    cursor: "pointer"
  }
};
