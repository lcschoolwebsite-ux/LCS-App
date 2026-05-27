import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  // Show a full-screen loader while auth state is being resolved (e.g., on page refresh)
  if (loading) {
    return (
      <div style={s.splash}>
        <div style={s.logo}>LC</div>
        <div style={s.schoolName}>Loretto Central School</div>
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
    borderRadius: "50%",
    border: "3px solid #c8960c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#c8960c",
    fontSize: "1.8rem",
    fontWeight: "900",
    letterSpacing: "0.05em",
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
