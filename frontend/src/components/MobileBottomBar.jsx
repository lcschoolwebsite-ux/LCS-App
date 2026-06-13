import { Link } from "react-router-dom";

export default function MobileBottomBar({
  items = [],
  currentPath = "",
  onMenuClick,
  menuLabel = "Menu",
  onLogout,
  logoutLabel = "Logout",
  className = "",
}) {
  return (
    <nav className={className} style={s.bar} aria-label="Mobile quick navigation">
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
    </nav>
  );
}

const s = {
  bar: {
    display: "none",
    alignItems: "center",
    gap: "8px",
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 120,
    padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))",
    background: "linear-gradient(135deg, #051a1a 0%, #094f4f 100%)",
    borderTop: "1px solid rgba(200, 150, 12, 0.28)",
    boxShadow: "0 -10px 28px rgba(0,0,0,0.18)",
    overflow: "hidden"
  },
  menuBtn: {
    minWidth: "66px",
    minHeight: "50px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "var(--white)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    padding: "8px 10px",
    fontSize: "0.64rem",
    fontWeight: 800,
    flex: "0 0 auto"
  },
  items: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    overflowX: "auto",
    flex: 1,
    minWidth: 0,
    paddingBottom: "2px",
    WebkitOverflowScrolling: "touch"
  },
  item: {
    minWidth: "72px",
    minHeight: "50px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.88)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    padding: "8px 10px",
    fontSize: "0.64rem",
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
    fontSize: "0.95rem",
    lineHeight: 1
  },
  logoutBtn: {
    minWidth: "70px",
    minHeight: "50px",
    borderRadius: "14px",
    border: "1px solid rgba(200,150,12,0.3)",
    background: "rgba(255,255,255,0.08)",
    color: "var(--white)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    padding: "8px 10px",
    fontSize: "0.62rem",
    fontWeight: 800,
    flex: "0 0 auto"
  }
};
