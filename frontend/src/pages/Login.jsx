import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import AppFooter from "../components/AppFooter";

// Complex Animated Background Component for Login
const AnimatedBackground = () => {
  const [stars, setStars] = useState([]);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newStars = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      scale: Math.random() * 0.5 + 0.5
    }));
    setStars(newStars);

    const newParticles = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 8}s`,
      duration: `${Math.random() * 10 + 10}s`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div style={bgStyles.wrapper}>
      <div style={bgStyles.gridFloor}></div>
      <div style={{...bgStyles.blob, ...bgStyles.blob1}}></div>
      <div style={{...bgStyles.blob, ...bgStyles.blob2}}></div>
      <div style={{...bgStyles.blob, ...bgStyles.blob3}}></div>
      <div style={{...bgStyles.ring, width: '400px', height: '400px', animation: 'spinSlow 20s linear infinite'}}><div style={bgStyles.ringDot}></div></div>
      <div style={{...bgStyles.ring, width: '600px', height: '600px', animation: 'spinReverse 30s linear infinite'}}><div style={bgStyles.ringDot}></div></div>
      <div style={{...bgStyles.ring, width: '800px', height: '800px', animation: 'spinSlow 40s linear infinite'}}><div style={bgStyles.ringDot}></div></div>
      {stars.map(star => (
        <div key={`star-${star.id}`} style={{
          position: 'absolute', width: '2px', height: '2px', background: '#fff', borderRadius: '50%',
          left: star.left, top: star.top, opacity: 0.2, transform: `scale(${star.scale})`,
          animation: `twinkle 4s ease-in-out infinite ${star.animationDelay}`
        }}></div>
      ))}
      {particles.map(p => (
        <div key={`part-${p.id}`} style={{
          position: 'absolute', width: '4px', height: '4px', background: 'var(--gold)', borderRadius: '50%',
          left: p.left, bottom: '-10px', boxShadow: '0 0 10px var(--gold)',
          animation: `particleRise ${p.duration} linear infinite ${p.animationDelay}`
        }}></div>
      ))}
    </div>
  );
};

const bgStyles = {
  wrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#051a1a', overflow: 'hidden', zIndex: -1 },
  gridFloor: {
    position: 'absolute', bottom: '-20%', left: '-50%', width: '200%', height: '60%',
    backgroundImage: `linear-gradient(rgba(200,150,12,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(200,150,12,0.1) 1px, transparent 1px)`,
    backgroundSize: '40px 40px', animation: 'gridFloat 20s linear infinite alternate', transformOrigin: 'top center'
  },
  blob: { position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.4, animation: 'morphBlob 10s ease-in-out infinite' },
  blob1: { width: '400px', height: '400px', background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)', top: '-100px', left: '-100px' },
  blob2: { width: '500px', height: '500px', background: 'radial-gradient(circle, var(--navy) 0%, transparent 70%)', bottom: '-200px', right: '-100px' },
  blob3: { width: '300px', height: '300px', background: 'radial-gradient(circle, #10b981) 0%, transparent 70%)', top: '40%', left: '50%', transform: 'translate(-50%, -50%)' },
  ring: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%' },
  ringDot: { position: 'absolute', top: '-3px', left: '50%', width: '6px', height: '6px', background: 'var(--gold)', borderRadius: '50%', boxShadow: '0 0 10px var(--gold)' }
};

export default function Login() {
  const [role, setRole] = useState("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(role, username, password);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "teacher") navigate("/teacher");
      else navigate("/student");
    } catch (e) {
      setError(e.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <AnimatedBackground />
      
      <div style={s.card}>
        <div style={s.logoWrapper}>
          <img src="/logo.png" alt="School Logo" style={s.logoImg} />
        </div>
        <h1 style={s.schoolName}>Loretto Central</h1>
        <p style={s.tagline}>love through service</p>

        <div style={s.roleSwitcher}>
          {["admin", "teacher"].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{...s.roleBtn, ...(role === r ? s.activeRoleBtn : {})}}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <p style={s.hintText}>Use your staff credentials to continue. Students have a dedicated login page.</p>

        <form onSubmit={handleLogin} style={s.form}>
          <input
            style={s.input}
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            style={s.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button style={s.submitBtn} type="submit" disabled={loading}>
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Sign In"}
          </button>
        </form>

        <div style={s.studentLinkWrap}>
          <span style={s.studentLinkText}>Student?</span>
          <Link to="/student-login" style={s.studentLink}>Go to student login</Link>
        </div>

        {error && <div style={s.errorBadge}>{error}</div>}
      </div>
      <AppFooter variant="dark" />
    </div>
  );
}

const s = {
  page: { width: "100%", minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "24px", overflow: "hidden", padding: "32px 16px" },
  card: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "20px", padding: "48px", width: "420px", boxShadow: "0 32px 80px rgba(0,0,0,0.4)", textAlign: "center", position: "relative", zIndex: 10 },
  logoWrapper: { display: "flex", justifyContent: "center", marginBottom: "20px" },
  logoImg: { width: "100px", height: "100px", objectFit: "contain", filter: "drop-shadow(0 0 10px var(--gold))", animation: "logoPulse 4s infinite" },
  schoolName: { fontFamily: "var(--font-heading)", color: "var(--white)", fontSize: "1.6rem", margin: 0 },
  tagline: { color: "var(--gold-light)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", margin: "4px 0 24px 0" },
  roleSwitcher: { display: "flex", background: "rgba(0,0,0,0.2)", borderRadius: "12px", padding: "4px", marginBottom: "16px" },
  roleBtn: { flex: 1, padding: "10px", borderRadius: "8px", color: "var(--white)", fontSize: "0.85rem", fontWeight: "600", transition: "var(--transition)" },
  activeRoleBtn: { background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "var(--navy-dark)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" },
  hintText: { color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", marginBottom: "24px", minHeight: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  input: { background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)", color: "var(--white)", borderRadius: "12px", padding: "14px 18px", fontSize: "0.95rem", fontFamily: "var(--font-body)", transition: "var(--transition)" },
  submitBtn: { background: "linear-gradient(135deg, #c8960c, #e8b020, #f5c842)", backgroundSize: "200% auto", color: "var(--navy-dark)", fontWeight: "800", borderRadius: "50px", padding: "15px", fontSize: "1rem", marginTop: "8px", animation: "shimmer 3s linear infinite", boxShadow: "0 8px 20px rgba(200,150,12,0.3)" },
  studentLinkWrap: { marginTop: "18px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" },
  studentLinkText: { color: "rgba(255,255,255,0.55)", fontSize: "0.8rem" },
  studentLink: { color: "var(--gold-light)", fontSize: "0.82rem", fontWeight: "700", textDecoration: "underline", textUnderlineOffset: "3px" },
  errorBadge: { background: "var(--danger-bg)", color: "var(--danger-text)", border: "1px solid var(--danger-text)", padding: "6px 16px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700", marginTop: "20px", display: "inline-block" }
};
