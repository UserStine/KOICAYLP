import { useState } from "react";
import { NavLink, Routes, Route, Link } from "react-router-dom";
import peko from "../assets/peko.png";
import BrandLogos from "../components/BrandLogos";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../i18n";
import { MenuIcon } from "../components/Icons";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Dashboard from "./Dashboard";
import Modules from "./Modules";
import ModuleDetail from "./ModuleDetail";
import Resources from "./Resources";
import Calendar from "./Calendar";

const HomeIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /></svg>
);
const BooksIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" /></svg>
);
const FolderIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 7a2 2 0 0 1 2-2h3.6l2 2.4h7.4a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></svg>
);
const CalendarIcon = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>);
const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10" /></svg>
);

export default function Portal() {
  const { user, logout } = useAuth();
  const { t } = useT();
  const p = t.portal;
  const [navOpen, setNavOpen] = useState(false);

  const links = [
    { to: "/portal", end: true, label: p.nav.dashboard, icon: <HomeIcon /> },
    { to: "/portal/modules", label: p.nav.modules, icon: <BooksIcon /> },
    { to: "/portal/resources", label: p.nav.resources, icon: <FolderIcon /> },
    { to: "/portal/calendar", label: p.nav.calendar, icon: <CalendarIcon /> },
  ];

  const initials = (user?.name || "?")
    .split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="portal">
      <aside className={`portal-side${navOpen ? " open" : ""}`}>
        <Link className="portal-brand" to="/">
          <BrandLogos compact />
        </Link>

        <div className="portal-user">
          <div className="portal-avatar">{initials}</div>
          <div className="portal-user-text">
            <strong>{user?.name}</strong>
            <small>{user?.track === "private" ? p.trackPrivate : p.trackPublic}</small>
          </div>
        </div>

        <nav className="portal-nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => `portal-link${isActive ? " active" : ""}`}
              onClick={() => setNavOpen(false)}>
              {l.icon}<span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        {user?.role === "admin" && (
          <Link className="portal-link admin-link" to="/admin">
            <span style={{ width: 19 }} /><span>{t.admin.badge}</span>
          </Link>
        )}

        <button className="portal-logout" onClick={logout}>
          <LogoutIcon /><span>{p.logout}</span>
        </button>
      </aside>

      <div className="portal-main">
        <div className="portal-topbar">
          <button className="portal-burger" onClick={() => setNavOpen((o) => !o)}
            aria-label={navOpen ? t.nav.closeMenu : t.nav.openMenu}>
            <MenuIcon open={navOpen} />
          </button>
          <div className="portal-topbar-actions"><LanguageSwitcher /><img className="portal-peko" src={peko} alt="" /></div>
        </div>

        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="modules" element={<Modules />} />
          <Route path="modules/:id" element={<ModuleDetail />} />
          <Route path="resources" element={<Resources />} />
          <Route path="calendar" element={<Calendar />} />
        </Routes>
      </div>

      {navOpen && <div className="portal-scrim" onClick={() => setNavOpen(false)} />}
    </div>
  );
}
