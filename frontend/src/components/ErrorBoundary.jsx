import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={s.wrapper}>
          <div style={s.card}>
            <div style={s.icon}>⚠️</div>
            <h1 style={s.title}>Something went wrong</h1>
            <p style={s.msg}>{this.state.error?.message || "An unexpected error occurred."}</p>
            <button style={s.btn} onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>
              <i className="fa-solid fa-rotate-right" style={{ marginRight: "8px" }}></i>Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const s = {
  wrapper: { position: "fixed", inset: 0, background: "linear-gradient(135deg, #051a1a, #094f4f)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 },
  card: { background: "#fff", borderRadius: "20px", padding: "48px 40px", maxWidth: "480px", textAlign: "center", boxShadow: "0 32px 80px rgba(0,0,0,0.4)" },
  icon: { fontSize: "3rem", marginBottom: "16px" },
  title: { fontSize: "1.5rem", fontWeight: "800", color: "#0e6b6b", marginBottom: "12px" },
  msg: { fontSize: "0.95rem", color: "#5a6e6e", marginBottom: "28px", lineHeight: 1.6 },
  btn: { background: "linear-gradient(135deg, #0e6b6b, #094f4f)", color: "#fff", border: "none", padding: "14px 32px", borderRadius: "30px", fontWeight: "700", cursor: "pointer", fontSize: "0.95rem" }
};
