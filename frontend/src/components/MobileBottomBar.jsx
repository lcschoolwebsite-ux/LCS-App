import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function MobileBottomBar({
  items = [],
  currentPath = "",
  onMenuClick,
  menuLabel = "Menu",
  className = "",
  forceVisible = false,
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // Always show when at the top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down - hide
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={`${className} ${forceVisible ? "force-visible" : ""}`.trim()}
      style={{...s.bar, transform: isVisible ? 'translateY(0)' : 'translateY(100%)'}}
      aria-label="Mobile quick navigation"
    >
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
    </nav>
  );
}

const s = {
  bar: {
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 120,
    padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))",
    background: "linear-gradient(135deg, #051a1a 0%, #094f4f 100%)",
    borderTop: "2px solid rgba(200, 150, 12, 0.5)",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.25)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  menuBtn: {
    minWidth: "56px",
    minHeight: "46px",
    borderRadius: "14px",
    border: "1px solid rgba(200,150,12,0.3)",
    background: "rgba(200,150,12,0.15)",
    color: "var(--gold-light)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    padding: "6px 10px",
    fontSize: "0.58rem",
    fontWeight: 800,
    flex: "0 0 auto",
    transition: "all 0.2s ease"
  },
  items: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flex: "0 0 auto"
  },
  item: {
    minWidth: "62px",
    minHeight: "46px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.9)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    padding: "6px 10px",
    fontSize: "0.58rem",
    fontWeight: 800,
    whiteSpace: "nowrap",
    flex: "0 0 auto",
    transition: "all 0.2s ease"
  },
  activeItem: {
    background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
    color: "var(--navy-dark)",
    borderColor: "var(--gold-light)",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(200, 150, 12, 0.4)"
  },
  icon: {
    fontSize: "0.95rem",
    lineHeight: 1
  }
};
