import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  // Show a full-screen loader while auth state is being resolved (e.g., on page refresh)
  if (loading) {
    return (
      <div style={s.splash}>
        <img src="/logo.png" alt="LCS Portal" style={s.logo} />
        <div style={s.schoolName}>LCS Portal</div>
        <div style={s.spinner}>
          <i className="fa-solid fa-circle-notch fa-spin"></i>
        </div>
        <div style={s.loadingText}>Verifying session...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}

const s = {
  splash: {
    position: "fixed",
    inset: 0,
    background: "linear-gradient(135deg, #051a1a 0%, #094f4f 60%, #0e6b6b 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    gap: "16px",
  },
  logo: {
    width: "80px",
    height: "80px",
    borderRadius: "18px",
    objectFit: "contain",
    padding: "8px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(200,150,12,0.35)",
    boxShadow: "0 0 0 6px rgba(200,150,12,0.08)",
    animation: "pulse 2s infinite",
  },
  schoolName: {
    color: "#ffffff",
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.3rem",
    fontWeight: "700",
    letterSpacing: "0.02em",
  },
  spinner: {
    color: "#c8960c",
    fontSize: "1.5rem",
    marginTop: "8px",
  },
  loadingText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: "0.85rem",
    fontWeight: "600",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
};
