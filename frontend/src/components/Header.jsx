import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import BrandLogos from "./BrandLogos";
import { MenuIcon } from "./Icons";
import LanguageSwitcher from "./LanguageSwitcher";
import { useT } from "../i18n";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useT();

  const NAV_LINKS = [
    { label: t.nav.program, to: "/program" },
    { label: t.nav.tracks, to: "/tracks" },
    { label: t.nav.eligibility, to: "/eligibility" },
    { label: t.nav.apply, to: "/apply" },
    { label: t.nav.faq, to: "/faq" },
    { label: t.nav.hub, to: "/#hub" },
  ];

  useEffect(() => { setMenuOpen(false); }, [location]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navItem = (l) =>
    l.to.includes("#") ? (
      <Link key={l.to} className="nav-link" to={l.to}>{l.label}</Link>
    ) : (
      <NavLink key={l.to} to={l.to}
        className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
        {l.label}
      </NavLink>
    );

  return (
    <>
      <header>
        <div className="header-left">
          <Link className="logo" to="/">
            <BrandLogos compact />
          </Link>
          <nav className="desktop-nav">{NAV_LINKS.map(navItem)}</nav>
        </div>
        <div className="header-right">
          <LanguageSwitcher />
          <Link className="login-link" to="/login">{t.nav.login}</Link>
          <div className="btn-border-wrap">
            <Link className="btn" to="/apply"><span>{t.nav.applyNow}</span></Link>
          </div>
          <button className="menu-toggle"
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}>
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu">
          {NAV_LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}>{l.label}</Link>
          ))}
          <Link to="/login" onClick={() => setMenuOpen(false)}>{t.nav.login}</Link>
          <div className="mobile-lang">
            <span className="mobile-lang-label">{t.nav.language}</span>
            <LanguageSwitcher inline />
          </div>
          <Link className="mobile-apply" to="/apply" onClick={() => setMenuOpen(false)}>
            {t.nav.applyNow}
          </Link>
        </div>
      )}
    </>
  );
}
