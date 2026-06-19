import { Link } from "react-router-dom";
import "./PortalHome.css";

export default function PortalHome() {
  return (
    <div className="portal-page">
      <div className="portal-bg" />
      <div className="portal-overlay" />

      <div className="portal-content">
        <main className="portal-hero-centre">
          {/* Modern Logo & Title */}
          <div className="portal-school-brand portal-hero-brand">
            <img src="/logo.png" alt="LCS Portal logo" className="portal-logo" />
            <div className="portal-school-name">
              <small>Welcome to</small>
              LCS Portal
            </div>
          </div>
          
          <div className="portal-gold-bar" />
          
          <h1 className="portal-hero-title">Welcome to<br />LCS Portal</h1>
          
          <p className="portal-hero-desc">
            Secure academic gateway for students and teachers
          </p>

          {/* Login Options */}
          <div className="portal-login-options">
            {/* Student Login Card */}
            <Link to="/student-login" className="portal-login-card portal-student-card">
              <div className="portal-login-icon">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <div className="portal-login-content">
                <h3 className="portal-login-title">Student Portal</h3>
                <p className="portal-login-desc">Access marks, attendance, fees & announcements</p>
                <div className="portal-login-cta">
                  <span>Login to Student Portal</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </div>
              </div>
            </Link>

            {/* Teacher Login Card */}
            <Link to="/head" className="portal-login-card portal-teacher-card">
              <div className="portal-login-icon">
                <i className="fa-solid fa-chalkboard-user"></i>
              </div>
              <div className="portal-login-content">
                <h3 className="portal-login-title">Teacher Portal</h3>
                <p className="portal-login-desc">Manage classes, marks, attendance & announcements</p>
                <div className="portal-login-cta">
                  <span>Login to Teacher Portal</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </div>
              </div>
            </Link>
          </div>

          {/* Admin Access Note */}
          <div className="portal-admin-note">
            <i className="fa-solid fa-lock" style={{marginRight: '8px'}}></i>
            <span>Administrator access requires separate credentials</span>
          </div>
        </main>
      </div>

      {/* Updated Footer */}
      <footer className="portal-footer">
        <span>© 2026 LCS Portal</span>
        <span className="portal-foot-divider" />
        <span>
          Developed by <a href="https://www.appvertex.in" target="_blank" rel="noopener noreferrer" className="portal-dev-link">AppVertex</a>
        </span>
        <span className="portal-foot-divider" />
        <span className="portal-footer-note">Built by Leston & Lenstar</span>
      </footer>
    </div>
  );
}
