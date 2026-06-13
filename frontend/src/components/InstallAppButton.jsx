import { useEffect, useState } from "react";
import { isNativeAndroidApp } from "../services/nativeBridge";

export default function InstallAppButton({ compact = false, className = "" }) {
  const [prompt, setPrompt] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPrompt(event);
    };

    const onAppInstalled = () => {
      setPrompt(null);
      setShowGuide(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (isNativeAndroidApp()) return null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

  if (isStandalone) return null;

  const install = async () => {
    if (isIOS || !prompt) {
      setShowGuide(true);
      return;
    }

    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setPrompt(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={install}
        aria-label="Install student portal"
        title={compact ? "Install app" : "Install student portal"}
        className={className}
        style={{ ...s.button, ...(compact ? s.buttonCompact : {}) }}
      >
        <i className="fa-solid fa-download" style={s.icon} />
        {!compact && <span>Install App</span>}
      </button>

      {showGuide && (
        <div style={s.overlay}>
          <div style={s.sheet}>
            <div style={s.sheetHead}>
              <div>
                <div style={s.sheetKicker}>LCS Portal</div>
                <h3 style={s.sheetTitle}>How to install</h3>
              </div>
              <button onClick={() => setShowGuide(false)} style={s.closeBtn} aria-label="Close install guide">
                ×
              </button>
            </div>

            <div style={s.steps}>
              {isIOS ? (
                <>
                  <p style={s.step}><strong>1.</strong> Open this portal in <strong>Safari</strong>.</p>
                  <p style={s.step}><strong>2.</strong> Tap the <strong>Share</strong> button.</p>
                  <p style={s.step}><strong>3.</strong> Choose <strong>Add to Home Screen</strong>.</p>
                </>
              ) : (
                <>
                  <p style={s.step}><strong>1.</strong> Open the browser menu.</p>
                  <p style={s.step}><strong>2.</strong> Choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</p>
                  <p style={s.step}><strong>3.</strong> Confirm the install to save it like an app.</p>
                </>
              )}
            </div>

            <button onClick={() => setShowGuide(false)} style={s.doneBtn}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const s = {
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(200,150,12,0.28)",
    background: "linear-gradient(135deg, var(--navy), var(--navy-dark))",
    color: "var(--white)",
    boxShadow: "0 8px 20px rgba(14,107,107,0.18)",
    fontSize: "0.82rem",
    fontWeight: "800",
    whiteSpace: "nowrap"
  },
  buttonCompact: {
    width: "38px",
    height: "38px",
    justifyContent: "center",
    padding: 0,
    borderRadius: "50%"
  },
  icon: {
    fontSize: "0.9rem",
    color: "var(--gold-light)"
  },
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
    color: "var(--text)",
    lineHeight: 1.5,
    background: "var(--light-bg)",
    borderRadius: "12px",
    padding: "12px 14px"
  },
  doneBtn: {
    width: "100%",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, var(--navy), var(--navy-dark))",
    color: "var(--white)",
    fontWeight: "800",
    padding: "12px 16px"
  }
};
