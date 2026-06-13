import { Link } from "react-router-dom";

export default function MobileMenuDrawer({
  open,
  title = "LCS Portal",
  subtitle = "",
  items = [],
  currentPath = "",
  onClose,
  onLogout,
  logoutLabel = "Logout"
}) {
  if (!open) return null;

  return (
    <div style={s.overlay} onClick={onClose} role="presentation">
      <div style={s.panel} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div style={s.head}>
          <div style={s.brand}>
            <img src="/logo.png" alt="LCS Portal logo" style={s.logo} />
            <div style={s.copy}>
              <div style={s.title}>{title}</div>
              {subtitle ? <div style={s.subtitle}>{subtitle}</div> : null}
            </div>
          </div>
          <button type="button" onClick={onClose} style={s.closeBtn} aria-label="Close menu">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <nav style={s.nav} aria-label={`${title} menu`}>
          {items.map((item) => {
            const active = currentPath === item.path || (item.match && currentPath.startsWith(item.match));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                style={{ ...s.link, ...(active ? s.activeLink : {}) }}
              >
                <i className={item.icon} style={s.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {onLogout ? (
          <button type="button" onClick={onLogout} style={s.logoutBtn}>
            <i className="fa-solid fa-arrow-right-from-bracket" />
            <span>{logoutLabel}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10040,
    background: "rgba(3, 12, 12, 0.58)",
    backdropFilter: "blur(6px)",
    display: "flex",
    justifyContent: "flex-start"
  },
  panel: {
    width: "min(300px, calc(100vw - 16px))",
    height: "100%",
    background: "linear-gradient(180deg, #051a1a 0%, #094f4f 100%)",
    color: "var(--white)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
    padding: "38px 18px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px"
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0
  },
  logo: {
    width: "48px",
    height: "48px",
    objectFit: "contain",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(200,150,12,0.28)",
    padding: "6px"
  },
  copy: {
    minWidth: 0
  },
  title: {
    color: "var(--white)",
    fontFamily: "var(--font-heading)",
    fontWeight: 700,
    fontSize: "1rem",
    lineHeight: 1.2
  },
  subtitle: {
    marginTop: "3px",
    fontSize: "0.72rem",
    color: "var(--gold-light)",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase"
  },
  closeBtn: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "var(--white)",
    minHeight: "44px"
  },
  nav: {
    display: "grid",
    gap: "10px",
    overflowY: "auto",
    paddingRight: "4px"
  },
  link: {
    minHeight: "48px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontWeight: 700
  },
  activeLink: {
    background: "var(--gold)",
    color: "var(--navy-dark)",
    borderColor: "var(--gold)"
  },
  icon: {
    width: "18px",
    textAlign: "center"
  },
  logoutBtn: {
    marginTop: "auto",
    minHeight: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    borderRadius: "14px",
    border: "1px solid rgba(200,150,12,0.3)",
    background: "rgba(255,255,255,0.06)",
    color: "var(--white)",
    fontWeight: 800
  }
};
