import { Link } from "react-router-dom";

export default function MobileBottomBar({
  items = [],
  currentPath = "",
  onMenuClick,
  menuLabel = "Menu",
  onLogout,
  logoutLabel = "Logout",
  className = "",
  schoolName = "",
  logoUrl = "/logo.png",
}) {
  return (
    <nav
      className={className}
      style={s.bar}
      aria-label="Mobile quick navigation"
    >
      <div style={s.topRow}>
        <img src={logoUrl} alt="Logo" style={s.logo} />
        <span style={s.schoolName}>{schoolName}</span>
      </div>
      
      <div style={s.bottomRow}>
        <button type="button" onClick={onMenuClick} style={s.menuBtn} aria-label={menuLabel}>
          <i className="fa-solid fa-bars" />
          <span>{menuLabel}</span>
        </button>

        <div style={s.items}>
          {items.map((item) => {
            const active = currentPath === item.path || (item.match && currentPath.startsWith(item.match));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{ ...s.item, ...(active ? s.activeItem : {}) }}
                aria-current={active ? "page" : undefined}
              >
                <i className={item.icon} style={s.icon} />
                <span>{item.shortLabel || item.label}</span>
              </Link>
            );
          })}
        </div>

        {onLogout ? (
          <button type="button" onClick={onLogout} style={s.logoutBtn} aria-label={logoutLabel}>
            <i className="fa-solid fa-right-from-bracket" />
            <span>{logoutLabel}</span>
          </button>
        ) : null}
      </div>
    </nav>
  );
}

const s = {
  bar: {
    display: "none",
    flexDirection: "column",
    gap: "8px",
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 120,
    padding: "10px 10px calc(10px + env(safe-area-inset-bottom, 0px))",
    background: "linear-gradient(135deg, #051a1a 0%, #094f4f 100%)",
    borderTop: "2px solid rgba(200, 150, 12, 0.4)",
    boxShadow: "0 -10px 28px rgba(0,0,0,0.18)"
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "4px 0"
  },
  logo: {
    width: "28px",
    height: "28px",
    objectFit: "contain"
  },
  schoolName: {
    fontFamily: "var(--font-heading)",
    color: "var(--gold-light)",
    fontSize: "0.9rem",
    fontWeight: "700",
    letterSpacing: "0.02em"
  },
  bottomRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  menuBtn: {
    minWidth: "52px",
    minHeight: "42px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "var(--white)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1px",
    padding: "6px 8px",
    fontSize: "0.56rem",
    fontWeight: 800,
    flex: "0 0 auto"
  },
  items: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    overflowX: "auto",
    flex: 1,
    minWidth: 0,
    paddingBottom: "2px",
    WebkitOverflowScrolling: "touch"
  },
  item: {
    minWidth: "58px",
    minHeight: "42px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.88)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1px",
    padding: "6px 8px",
    fontSize: "0.56rem",
    fontWeight: 800,
    whiteSpace: "nowrap",
    flex: "0 0 auto"
  },
  activeItem: {
    background: "var(--gold)",
    color: "var(--navy-dark)",
    borderColor: "var(--gold)"
  },
  icon: {
    fontSize: "0.86rem",
    lineHeight: 1
  },
  logoutBtn: {
    minWidth: "54px",
    minHeight: "42px",
    borderRadius: "12px",
    border: "1px solid rgba(200,150,12,0.3)",
    background: "rgba(255,255,255,0.08)",
    color: "var(--white)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1px",
    padding: "6px 8px",
    fontSize: "0.54rem",
    fontWeight: 800,
    flex: "0 0 auto"
  }
};
