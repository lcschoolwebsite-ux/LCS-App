import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppFooter from "../components/AppFooter";
import {
  getActiveStudentProfile,
  loadStudentProfiles,
  saveStudentProfile,
  setActiveStudentProfile,
  studentProfileSummary,
  getStudentProfilePhoto
} from "../services/studentSessions";
import { isNativeAndroidApp } from "../services/nativeBridge";

const bgStyles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(145deg, #051a1a 0%, #073535 50%, #051a1a 100%)",
    color: "var(--white)",
  },
  shell: {
    position: "relative",
    zIndex: 1,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "18px 40px",
    background: "rgba(5, 26, 26, 0.92)",
    borderBottom: "1px solid rgba(200,150,12,0.12)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  brand: { display: "flex", alignItems: "center", gap: "14px" },
  brandMark: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    border: "2px solid var(--gold)",
    display: "grid",
    placeItems: "center",
    fontFamily: "var(--font-heading)",
    fontWeight: 800,
    color: "var(--gold-light)",
    boxShadow: "0 0 0 4px rgba(200,150,12,0.08)",
  },
  brandLogo: {
    width: "48px",
    height: "48px",
    objectFit: "contain",
    filter: "drop-shadow(0 0 10px rgba(200,150,12,0.35))",
    flexShrink: 0,
  },
  brandText: { display: "flex", flexDirection: "column", gap: "2px" },
  brandName: {
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    fontSize: "1.05rem",
    lineHeight: 1.2,
  },
  brandTag: {
    fontSize: "0.62rem",
    color: "var(--gold-light)",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    opacity: 0.85,
  },
  backLink: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "0.78rem",
    fontWeight: 700,
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "9px 16px",
    borderRadius: "999px",
    transition: "var(--transition)",
  },
  main: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    position: "relative",
  },
  grid: {
    position: "absolute",
    inset: "-20%",
    backgroundImage:
      "linear-gradient(rgba(200,150,12,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(200,150,12,0.055) 1px, transparent 1px)",
    backgroundSize: "52px 52px",
    transform: "perspective(900px) rotateX(52deg) translateY(-8%)",
    transformOrigin: "center bottom",
    animation: "gridFloat 10s linear infinite",
    maskImage:
      "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)",
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: "1060px",
    minHeight: "600px",
    display: "grid",
    gridTemplateColumns: "1.15fr 0.95fr",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow:
      "0 0 0 1px rgba(200,150,12,0.14), 0 40px 90px rgba(0,0,0,0.55), 0 0 50px rgba(14,107,107,0.12)",
    animation: "fadeInUp 0.7s cubic-bezier(0.34,1.1,0.64,1) 0.1s both",
    position: "relative",
    zIndex: 1,
  },
  left: {
    position: "relative",
    overflow: "hidden",
    padding: "56px 48px",
    background:
      "linear-gradient(155deg, rgba(9,79,79,0.97) 0%, rgba(14,107,107,0.88) 60%, rgba(5,26,26,0.99) 100%)",
    borderRight: "1px solid rgba(200,150,12,0.12)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "30px",
  },
  leftGlow: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(200,150,12,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,150,12,0.04) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    pointerEvents: "none",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(200,150,12,0.13)",
    border: "1px solid rgba(200,150,12,0.3)",
    borderRadius: "999px",
    padding: "6px 16px",
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "var(--gold-light)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "26px",
  },
  badgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--gold-light)",
    animation: "twinkle 2s ease-in-out infinite",
  },
  title: {
    fontFamily: "var(--font-heading)",
    fontSize: "2.5rem",
    lineHeight: 1.15,
    fontWeight: 800,
    marginBottom: "14px",
    color: "#ffffff",
  },
  titleAccent: {
    color: "#ffffff",
    fontStyle: "italic",
  },
  desc: {
    maxWidth: "360px",
    fontSize: "0.92rem",
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.62)",
    marginBottom: "40px",
  },
  featureList: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  feature: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "16px",
    minHeight: "116px",
    transition: "var(--transition)",
  },
  featureNumber: {
    display: "inline-flex",
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(200,150,12,0.12)",
    border: "1px solid rgba(200,150,12,0.22)",
    color: "var(--gold-light)",
    fontSize: "0.82rem",
    fontWeight: 800,
    marginBottom: "10px",
  },
  featureTitle: { fontSize: "0.9rem", fontWeight: 700, marginBottom: "4px" },
  featureText: {
    fontSize: "0.76rem",
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.52)",
  },
  featureTextCompact: {
    fontSize: "0.76rem",
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.52)",
    maxWidth: "240px",
  },
  quote: {
    borderTop: "1px solid rgba(255,255,255,0.07)",
    paddingTop: "24px",
    fontFamily: "var(--font-heading)",
    fontStyle: "italic",
    fontSize: "0.84rem",
    lineHeight: 1.75,
    color: "rgba(255,255,255,0.34)",
  },
  quoteAuthor: {
    display: "block",
    marginTop: "8px",
    fontFamily: "var(--font-body)",
    fontStyle: "normal",
    color: "rgba(200,150,12,0.5)",
    fontSize: "0.68rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 700,
  },
  right: {
    position: "relative",
    overflow: "hidden",
    background: "rgba(255,255,255,0.97)",
    padding: "52px 44px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  rightTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "3px",
    background: "linear-gradient(90deg, transparent, var(--gold), var(--gold-light), var(--gold), transparent)",
  },
  watermark: {
    position: "absolute",
    bottom: "-22px",
    right: "-10px",
    fontFamily: "var(--font-heading)",
    fontSize: "8rem",
    fontWeight: 800,
    color: "rgba(14,107,107,0.038)",
    lineHeight: 1,
    userSelect: "none",
    pointerEvents: "none",
  },
  form: { position: "relative", zIndex: 1 },
  ring: {
    position: "relative",
    width: "92px",
    height: "92px",
    margin: "0 auto 22px",
  },
  orbit1: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "1.5px solid rgba(14,107,107,0.18)",
    animation: "spinSlow 9s linear infinite",
  },
  orbit2: {
    position: "absolute",
    inset: "7px",
    borderRadius: "50%",
    border: "1.5px solid rgba(200,150,12,0.18)",
    animation: "spinReverse 6s linear infinite",
  },
  core: {
    position: "absolute",
    inset: "14px",
    borderRadius: "50%",
    background: "radial-gradient(circle at 30% 30%, #ffffff 0%, #f7f2e6 100%)",
    border: "2px solid rgba(200,150,12,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  coreLogo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
    objectPosition: "center center",
    filter: "drop-shadow(0 0 6px rgba(200,150,12,0.28))",
  },
  formTitle: {
    fontFamily: "var(--font-heading)",
    fontSize: "1.95rem",
    fontWeight: 800,
    color: "var(--navy-dark)",
    lineHeight: 1.2,
    marginBottom: "8px",
  },
  formSub: {
    fontSize: "0.88rem",
    color: "var(--text-muted)",
    lineHeight: 1.6,
    marginBottom: "30px",
  },
  field: { marginBottom: "18px" },
  label: {
    display: "block",
    fontSize: "0.68rem",
    fontWeight: 800,
    color: "var(--gold)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  inputWrap: {
    position: "relative",
  },
  prefix: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "46px",
    display: "grid",
    placeItems: "center",
    background: "var(--navy-dark)",
    borderRadius: "12px 0 0 12px",
    color: "var(--gold-light)",
    fontSize: "0.9rem",
    zIndex: 1,
  },
  input: {
    width: "100%",
    padding: "13px 54px 13px 58px",
    border: "1.5px solid var(--border)",
    borderRadius: "12px",
    background: "var(--light-bg)",
    color: "var(--text)",
    fontSize: "0.95rem",
    transition: "var(--transition)",
  },
  inputPlain: {
    width: "100%",
    padding: "13px 16px 13px 58px",
    border: "1.5px solid var(--border)",
    borderRadius: "12px",
    background: "var(--light-bg)",
    color: "var(--text)",
    fontSize: "0.95rem",
    transition: "var(--transition)",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    padding: "4px 6px",
    color: "var(--text-muted)",
    fontSize: "0.78rem",
    fontWeight: 700,
    zIndex: 2,
  },
  hint: {
    marginTop: "6px",
    paddingLeft: "3px",
    fontSize: "0.68rem",
    color: "rgba(90,110,110,0.62)",
  },
  extrasRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  remember: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.78rem",
    color: "var(--text-muted)",
    fontWeight: 600,
  },
  rememberInput: { width: "16px", height: "16px", accentColor: "var(--navy)" },
  forgot: {
    color: "var(--navy)",
    fontSize: "0.78rem",
    fontWeight: 700,
  },
  submit: {
    width: "100%",
    padding: "15px",
    borderRadius: "13px",
    background: "linear-gradient(135deg, var(--navy-dark) 0%, var(--navy) 100%)",
    color: "#fff",
    fontSize: "0.98rem",
    fontWeight: 800,
    letterSpacing: "0.03em",
    boxShadow: "0 8px 28px rgba(14,107,107,0.32), inset 0 1px 0 rgba(255,255,255,0.1)",
  },
  submitInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
  },
  spinner: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "2.5px solid rgba(255,255,255,0.28)",
    borderTopColor: "#fff",
    animation: "spinSlow 0.6s linear infinite",
  },
  error: {
    marginTop: "14px",
    padding: "12px 16px",
    borderRadius: "10px",
    fontSize: "0.8rem",
    fontWeight: 600,
    lineHeight: 1.5,
    background: "var(--danger-bg)",
    color: "var(--danger-text)",
    border: "1px solid #fecaca",
    borderLeft: "3px solid #ef4444",
  },
  savedProfilesBtn: {
    width: "100%",
    marginTop: "12px",
    padding: "12px 16px",
    borderRadius: "13px",
    border: "1px solid rgba(14,107,107,0.18)",
    background: "rgba(14,107,107,0.06)",
    color: "var(--navy)",
    fontWeight: 800,
    minHeight: "48px",
  },
  profileShell: {
    width: "100%",
    borderRadius: "24px",
    padding: "24px",
    background: "rgba(255,255,255,0.96)",
    color: "var(--text)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.24)",
    position: "relative",
    zIndex: 1,
  },
  profileTop: {
    marginBottom: "18px",
    textAlign: "center",
  },
  profileBadge: {
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "var(--gold-pale)",
    color: "var(--navy-dark)",
    fontSize: "0.72rem",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "10px",
  },
  profileTitle: {
    margin: 0,
    color: "var(--navy)",
    fontFamily: "var(--font-heading)",
    fontSize: "1.55rem",
    lineHeight: 1.2,
  },
  profileCopy: {
    margin: "10px auto 0",
    maxWidth: "540px",
    color: "var(--text-muted)",
    fontSize: "0.9rem",
    lineHeight: 1.6,
  },
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    minHeight: "72px",
    borderRadius: "18px",
    padding: "14px",
    border: "1px solid var(--border)",
    background: "var(--light-bg)",
    color: "var(--text)",
    textAlign: "left",
    boxShadow: "var(--shadow-sm)",
  },
  profileCardActive: {
    borderColor: "var(--gold)",
    boxShadow: "0 10px 24px rgba(200,150,12,0.16)",
    background: "linear-gradient(135deg, rgba(245,230,192,0.95), rgba(255,255,255,0.98))",
  },
  profilePhoto: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid var(--gold)",
    flex: "0 0 auto",
  },
  profileAvatar: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, var(--navy), var(--navy-dark))",
    color: "var(--white)",
    fontWeight: 900,
    flex: "0 0 auto",
  },
  profileText: {
    minWidth: 0,
  },
  profileName: {
    fontWeight: 900,
    fontSize: "0.95rem",
    color: "var(--navy)",
    lineHeight: 1.2,
  },
  profileClass: {
    marginTop: "3px",
    fontSize: "0.78rem",
    color: "var(--text-muted)",
    fontWeight: 700,
  },
  differentAccountBtn: {
    width: "100%",
    marginTop: "16px",
    border: "none",
    borderRadius: "14px",
    padding: "14px 16px",
    minHeight: "48px",
    background: "linear-gradient(135deg, var(--navy), var(--navy-dark))",
    color: "var(--white)",
    fontWeight: 800,
    boxShadow: "var(--shadow-sm)",
  },
  foot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "18px",
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    flexWrap: "wrap",
  },
  footLink: { color: "var(--navy)", fontWeight: 700 },
  divider: { color: "var(--border)" },
};

function LoginField({ label, hint, icon, type, value, onChange, placeholder, autoComplete, showToggle, showValue, onToggle }) {
  return (
    <div style={bgStyles.field}>
      <label style={bgStyles.label}>{label}</label>
      <div style={bgStyles.inputWrap}>
        <div style={bgStyles.prefix}>{icon}</div>
        <input
          style={showToggle ? bgStyles.input : bgStyles.inputPlain}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={type === "password" ? "numeric" : undefined}
          required
        />
        {showToggle ? (
          <button type="button" style={bgStyles.eyeBtn} onClick={onToggle}>
            {showValue ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
      <div style={bgStyles.hint}>{hint}</div>
    </div>
  );
}

export default function StudentLogin() {
  const [statsCode, setStatsCode] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [showMobile, setShowMobile] = useState(false);
  const [remember, setRemember] = useState(isNativeAndroidApp());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [isProfilePicker, setIsProfilePicker] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [stars, setStars] = useState([]);
  const [particles, setParticles] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const { login, restoreSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 900);
    updateViewport();
    window.addEventListener("resize", updateViewport);

    const nextStars = Array.from({ length: 52 }).map((_, id) => ({
      id,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      scale: Math.random() * 0.45 + 0.45,
    }));
    const nextParticles = Array.from({ length: 14 }).map((_, id) => ({
      id,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${Math.random() * 10 + 10}s`,
    }));
    setStars(nextStars);
    setParticles(nextParticles);

    const loadProfiles = async () => {
      const profiles = await loadStudentProfiles();
      setSavedProfiles(profiles);
      const active = await getActiveStudentProfile();
      setSelectedProfileId(active?.profileId || profiles[0]?.profileId || "");
      setIsProfilePicker(profiles.length > 0);
    };

    loadProfiles();

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const refreshProfiles = async () => {
    const profiles = await loadStudentProfiles();
    setSavedProfiles(profiles);
    const active = await getActiveStudentProfile();
    setSelectedProfileId(active?.profileId || profiles[0]?.profileId || "");
    setIsProfilePicker(profiles.length > 0);
  };

  const openProfile = async (profile) => {
    try {
      setError("");
      setLoading(true);
      await setActiveStudentProfile(profile.profileId);
      await restoreSession({ token: profile.token, user: profile.user });
      navigate("/student");
    } catch (err) {
      setError(err?.message || "Unable to open saved profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user, token } = await login("student", statsCode.trim(), mobileNo.trim());
      if (user?.role !== "student") {
        throw new Error("This page is only for student accounts.");
      }
      if (remember) {
        await saveStudentProfile(user, token);
        await refreshProfiles();
      }
      navigate("/student");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Student login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={bgStyles.page}>
      <div style={bgStyles.shell}>
        <header
          style={{
            ...bgStyles.topBar,
            padding: isMobile ? "14px 16px" : bgStyles.topBar.padding,
            justifyContent: isMobile ? "center" : bgStyles.topBar.justifyContent,
          }}
        >
          <div style={bgStyles.brand}>
            <img
              src="/logo.png"
              alt="LCS Portal logo"
              style={{
                ...bgStyles.brandLogo,
                width: isMobile ? "42px" : bgStyles.brandLogo.width,
                height: isMobile ? "42px" : bgStyles.brandLogo.height,
              }}
            />
            <div style={bgStyles.brandText}>
              <div style={{ ...bgStyles.brandName, fontSize: isMobile ? "0.92rem" : bgStyles.brandName.fontSize }}>
                LCS Portal
              </div>
              <div style={{ ...bgStyles.brandTag, letterSpacing: isMobile ? "0.12em" : bgStyles.brandTag.letterSpacing }}>
                Loretto Central School
              </div>
            </div>
          </div>
        </header>

        <main
          style={{
            ...bgStyles.main,
            padding: isMobile ? "20px 14px 28px" : bgStyles.main.padding,
            alignItems: isMobile ? "flex-start" : bgStyles.main.alignItems,
          }}
        >
          <div style={bgStyles.grid} />

          {stars.map((star) => (
            <div
              key={star.id}
              style={{
                position: "absolute",
                width: "2px",
                height: "2px",
                borderRadius: "50%",
                background: "#fff",
                left: star.left,
                top: star.top,
                opacity: 0.2,
                transform: `scale(${star.scale})`,
                animation: `twinkle 4s ease-in-out infinite ${star.delay}`,
              }}
            />
          ))}

          {particles.map((particle) => (
            <div
              key={particle.id}
              style={{
                position: "absolute",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: "var(--gold)",
                left: particle.left,
                bottom: "-10px",
                boxShadow: "0 0 10px var(--gold)",
                animation: `particleRise ${particle.duration} linear infinite ${particle.delay}`,
              }}
            />
          ))}

          {isProfilePicker ? (
            <section style={{ ...bgStyles.profileShell, maxWidth: isMobile ? "560px" : "720px" }}>
              <div style={bgStyles.profileTop}>
                <div style={bgStyles.profileBadge}>Welcome back</div>
                <h2 style={bgStyles.profileTitle}>Tap a profile to enter LCS Portal</h2>
                <p style={bgStyles.profileCopy}>Your saved student profiles are stored securely on this device. Choose one to continue instantly.</p>
              </div>

              <div style={bgStyles.profileGrid}>
                {savedProfiles.map((profile) => {
                  const { name, classLabel } = studentProfileSummary(profile);
                  const photoUrl = getStudentProfilePhoto(profile);
                  const active = selectedProfileId === profile.profileId;

                  return (
                    <button
                      key={profile.profileId}
                      type="button"
                      onClick={() => openProfile(profile)}
                      style={{
                        ...bgStyles.profileCard,
                        ...(active ? bgStyles.profileCardActive : {})
                      }}
                    >
                      {photoUrl ? (
                        <img src={photoUrl} alt={name} style={bgStyles.profilePhoto} />
                      ) : (
                        <div style={bgStyles.profileAvatar}>{name?.[0] || "S"}</div>
                      )}
                      <div style={bgStyles.profileText}>
                        <div style={bgStyles.profileName}>{name}</div>
                        <div style={bgStyles.profileClass}>{classLabel || "LCS Portal"}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsProfilePicker(false)}
                style={bgStyles.differentAccountBtn}
              >
                Login with different account
              </button>
            </section>
          ) : (
            <section
              style={{
                ...bgStyles.card,
                gridTemplateColumns: isMobile ? "1fr" : bgStyles.card.gridTemplateColumns,
                minHeight: isMobile ? "auto" : bgStyles.card.minHeight,
                maxWidth: isMobile ? "560px" : bgStyles.card.maxWidth,
                borderRadius: isMobile ? "20px" : bgStyles.card.borderRadius,
              }}
            >
              <div
                style={{
                  ...bgStyles.left,
                  display: isMobile ? "none" : bgStyles.left.display,
                }}
              >
              <div style={bgStyles.leftGlow} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={bgStyles.badge}>
                  <span style={bgStyles.badgeDot} />
                  LCS Portal
                </div>
                <h1 style={bgStyles.title}>
                  Your gateway to <span style={bgStyles.titleAccent}>academic excellence</span>
                </h1>
                <p style={bgStyles.desc}>
                  Access assignments, results, timetable updates, and school notices in one secure place.
                </p>

                <div style={bgStyles.featureList}>
                  <article style={bgStyles.feature}>
                    <div style={bgStyles.featureNumber}>01</div>
                    <div style={bgStyles.featureTitle}>Study resources</div>
                    <div style={bgStyles.featureText}>Notes, syllabus details, and learning material in one place.</div>
                  </article>
                  <article style={bgStyles.feature}>
                    <div style={bgStyles.featureNumber}>02</div>
                    <div style={bgStyles.featureTitle}>Results and marks</div>
                    <div style={bgStyles.featureText}>Check performance reports and track academic progress.</div>
                  </article>
                  <article style={bgStyles.feature}>
                    <div style={bgStyles.featureNumber}>03</div>
                    <div style={bgStyles.featureTitle}>Attendance tracker</div>
                    <div style={bgStyles.featureTextCompact}>View attendance updates and keep track of your regularity.</div>
                  </article>
                  <article style={bgStyles.feature}>
                    <div style={bgStyles.featureNumber}>04</div>
                    <div style={bgStyles.featureTitle}>Live notices</div>
                    <div style={bgStyles.featureText}>Receive announcements from the school instantly.</div>
                  </article>
                </div>
              </div>

              <div style={bgStyles.quote}>
                "Education is not preparation for life; education is life itself."
                <span style={bgStyles.quoteAuthor}>John Dewey</span>
              </div>
            </div>

              <div
                style={{
                  ...bgStyles.right,
                  padding: isMobile ? "28px 18px" : bgStyles.right.padding,
                }}
              >
                <div style={bgStyles.rightTopBar} />
                <div style={bgStyles.watermark}>LCS</div>

                <form style={bgStyles.form} onSubmit={handleSubmit}>
                  <div
                    style={{
                      ...bgStyles.ring,
                      width: isMobile ? "84px" : bgStyles.ring.width,
                      height: isMobile ? "84px" : bgStyles.ring.height,
                      marginBottom: isMobile ? "18px" : bgStyles.ring.marginBottom,
                    }}
                  >
                    <div style={bgStyles.orbit1} />
                    <div style={bgStyles.orbit2} />
                    <div style={bgStyles.core}>
                      <img
                        src="/logo.png"
                        alt="LCS Portal logo"
                        style={{
                          ...bgStyles.coreLogo,
                          width: isMobile ? "100%" : bgStyles.coreLogo.width,
                          height: isMobile ? "100%" : bgStyles.coreLogo.height,
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  </div>
  
                  <h2
                    style={{
                      ...bgStyles.formTitle,
                      fontSize: isMobile ? "1.55rem" : bgStyles.formTitle.fontSize,
                      textAlign: isMobile ? "center" : "left",
                    }}
                  >
                    Student sign in
                  </h2>
                  <p style={bgStyles.formSub}>
                    Enter your stats code and registered mobile number to access LCS Portal.
                  </p>

                  <LoginField
                    label="Stats Code"
                    hint="Found on your ID card or admit card"
                    icon="ID"
                    type="text"
                    value={statsCode}
                    onChange={(e) => setStatsCode(e.target.value)}
                    placeholder="Your student ID"
                    autoComplete="username"
                  />

                  <LoginField
                    label="Mobile Number"
                    hint="Registered mobile number from admission"
                    icon="PH"
                    type={showMobile ? "text" : "password"}
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    placeholder="Registered mobile number"
                    autoComplete="current-password"
                    showToggle
                    showValue={showMobile}
                    onToggle={() => setShowMobile((next) => !next)}
                  />

                  <div
                    style={{
                      ...bgStyles.extrasRow,
                      flexDirection: isMobile ? "column" : bgStyles.extrasRow.flexDirection,
                      alignItems: isMobile ? "stretch" : bgStyles.extrasRow.alignItems,
                      gap: isMobile ? "10px" : bgStyles.extrasRow.gap,
                    }}
                  >
                    <label style={bgStyles.remember}>
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        style={bgStyles.rememberInput}
                      />
                      Keep me signed in
                    </label>
                    <a
                      style={bgStyles.forgot}
                      href="mailto:Lorettocentralschool@gmail.com?subject=Student%20Login%20Help&body=Please%20contact%20the%20school%20office%20for%20student%20login%20assistance."
                    >
                      Forgot credentials?
                    </a>
                  </div>

                  <button style={bgStyles.submit} type="submit" disabled={loading}>
                    {loading ? (
                      <span style={bgStyles.submitInner}>
                        <span style={bgStyles.spinner} />
                        Signing in...
                      </span>
                    ) : (
                      <span style={bgStyles.submitInner}>Sign in to portal</span>
                    )}
                  </button>

                  {error ? <div style={bgStyles.error}>{error}</div> : null}

                  {savedProfiles.length > 0 && (
                    <button type="button" onClick={() => setIsProfilePicker(true)} style={bgStyles.savedProfilesBtn}>
                      Open saved profiles
                    </button>
                  )}

                </form>
              </div>
            </section>
          )}
        </main>

        <AppFooter variant="dark" />
      </div>
    </div>
  );
}
