import { Link } from "react-router-dom";
import "./PortalHome.css";

export default function PortalHome() {
  return (
    <div className="portal-page">
      <div className="portal-bg" />
      <div className="portal-overlay" />

      <div className="portal-content">
        <header className="portal-top-bar">
          <div className="portal-school-brand">
            <img src="/logo.png" alt="Loretto Central School logo" className="portal-logo" />
            <div className="portal-school-name">
              <small>Welcome to the</small>
              Loretto Central School
            </div>
          </div>

          <div className="portal-top-actions">
            <span className="portal-tag">portal.lorettocentralschool.edu.in</span>
          </div>
        </header>

        <main className="portal-hero-centre">
          <p className="portal-hero-eyebrow">Student Portal</p>
          <h1 className="portal-hero-title">Loretto <span>Central</span> School</h1>
          <div className="portal-gold-bar" />
          <p className="portal-hero-desc">
            Your all-in-one academic gateway - access results, resources,
            news, and more from one secure, modern portal.
          </p>
          <Link to="/student-login" className="portal-hero-cta">Login to Portal &nbsp;→</Link>
        </main>

        <section className="portal-info-row" aria-label="Portal highlights">
          <article className="portal-info-card">
            <div className="portal-info-icon">SA</div>
            <div className="portal-info-text">
              <h4>Secure Access</h4>
              <p>Industry-standard encryption keeps your data safe on any device, anytime.</p>
            </div>
          </article>
          <article className="portal-info-card">
            <div className="portal-info-icon">AR</div>
            <div className="portal-info-text">
              <h4>Academic Records</h4>
              <p>View attendance, exam results, progress reports and timetables at a glance.</p>
            </div>
          </article>
          <article className="portal-info-card">
            <div className="portal-info-icon">LU</div>
            <div className="portal-info-text">
              <h4>Live Updates</h4>
              <p>Real-time school announcements, event schedules and important notices.</p>
            </div>
          </article>
        </section>

        <section className="portal-quick-links" aria-label="Quick links">
          <p className="portal-ql-label">Quick Links</p>
          <div className="portal-ql-row">
            <a href="https://lorettocentralschool.edu.in/news" className="portal-ql-card" target="_blank" rel="noopener noreferrer">
              <span className="portal-ql-icon">NW</span>
              <span className="portal-ql-name">News</span>
              <span className="portal-ql-arrow">OPEN →</span>
            </a>
            <a href="https://lorettocentralschool.edu.in/school-information/school-gallery" className="portal-ql-card" target="_blank" rel="noopener noreferrer">
              <span className="portal-ql-icon">GL</span>
              <span className="portal-ql-name">Gallery</span>
              <span className="portal-ql-arrow">OPEN →</span>
            </a>
            <a href="https://lorettocentralschool.edu.in/about-us/1-school-profile" className="portal-ql-card" target="_blank" rel="noopener noreferrer">
              <span className="portal-ql-icon">SI</span>
              <span className="portal-ql-name">School Info</span>
              <span className="portal-ql-arrow">OPEN →</span>
            </a>
            <a href="https://lorettocentralschool.edu.in/e-magazine" className="portal-ql-card" target="_blank" rel="noopener noreferrer">
              <span className="portal-ql-icon">EM</span>
              <span className="portal-ql-name">E-Magazine</span>
              <span className="portal-ql-arrow">OPEN →</span>
            </a>
          </div>
        </section>
      </div>

      <footer className="portal-footer">
        <span>© 2025 Loretto Central School</span>
        <span className="portal-foot-divider" />
        <span>
          Developed by <a href="https://www.appvertex.in" target="_blank" rel="noopener noreferrer">AppVertex</a>
        </span>
        <span className="portal-foot-divider" />
        <span className="portal-footer-note">Built by Leston &amp; Lenstar</span>
      </footer>
    </div>
  );
}
