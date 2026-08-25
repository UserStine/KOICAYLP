import { useState } from "react";
import { NavLink, Routes, Route, Link, Navigate } from "react-router-dom";
import BrandLogos from "../components/BrandLogos";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../i18n";
import { MenuIcon } from "../components/Icons";
import LanguageSwitcher from "../components/LanguageSwitcher";
import AdminModules from "./AdminModules";
import AdminAnnouncements from "./AdminAnnouncements";
import AdminResources from "./AdminResources";
import AdminParticipants from "./AdminParticipants";
import AdminApplicationSettings from "./AdminApplicationSettings";
import AdminApplicationSubmissions from "./AdminApplicationSubmissions";
import AdminKnowledgeBase from "./AdminKnowledgeBase";

const I = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
const BooksIcon = () => <svg {...I}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" /></svg>;
const MegaIcon = () => <svg {...I}><path d="M4 10v4a1 1 0 0 0 1 1h3l6 4V5L8 9H5a1 1 0 0 0-1 1zM18 9.5a4 4 0 0 1 0 5" /></svg>;
const FolderIcon = () => <svg {...I}><path d="M3.5 7a2 2 0 0 1 2-2h3.6l2 2.4h7.4a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" /></svg>;
const PeopleIcon = () => <svg {...I}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c0-3.2 2.5-5.4 5.5-5.4s5.5 2.2 5.5 5.4M16 5.2a3.2 3.2 0 0 1 0 6M17.5 14.9c2 .7 3 2.6 3 5.1" /></svg>;
const BrainIcon = () => <svg {...I}><path d="M9.5 4.5a3 3 0 0 0-5 2.2A3 3 0 0 0 5 12a3 3 0 0 0 2.2 5A3 3 0 0 0 12 19.5V5.8a3.2 3.2 0 0 0-2.5-1.3z"/><path d="M14.5 4.5a3 3 0 0 1 5 2.2A3 3 0 0 1 19 12a3 3 0 0 1-2.2 5A3 3 0 0 1 12 19.5M8 9h2M14 9h2M8 14h2M14 14h2"/></svg>;
const InboxIcon = () => <svg {...I}><path d="M4 4h16v16H4z" /><path d="M4 14h4l2 3h4l2-3h4" /></svg>;
const SettingsIcon = () => <svg {...I}><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z" /></svg>;
const ExitIcon = () => <svg {...I}><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10" /></svg>;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { t } = useT();
  const a = t.admin;
  const [navOpen, setNavOpen] = useState(false);

  /* participants never reach the admin area */
  if (user?.role !== "admin") return <Navigate to="/portal" replace />;

  const links = [
    { to: "/admin", end: true, label: a.nav.modules, icon: <BooksIcon /> },
    { to: "/admin/announcements", label: a.nav.announcements, icon: <MegaIcon /> },
    { to: "/admin/resources", label: a.nav.resources, icon: <FolderIcon /> },
    { to: "/admin/participants", label: a.nav.participants, icon: <PeopleIcon /> },
    { to: "/admin/applications", label: a.nav.applications, icon: <SettingsIcon /> },
    { to: "/admin/knowledge", label: a.nav.knowledge, icon: <BrainIcon /> },
    { to: "/admin/submissions", label: a.nav.submissions, icon: <InboxIcon /> },
  ];

  return (
    <div className="portal admin">
      <aside className={`portal-side${navOpen ? " open" : ""}`}>
        <Link className="portal-brand" to="/">
          <BrandLogos compact />
        </Link>

        <div className="admin-badge">{a.badge}</div>

        <div className="portal-user">
          <div className="portal-avatar admin-avatar">
            {(user?.name || "?").split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
          </div>
          <div className="portal-user-text">
            <strong>{user?.name}</strong>
            <small>{a.role}</small>
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
          <Link className="portal-link" to="/portal">
            <span style={{ width: 19 }} /><span>{a.viewAsParticipant}</span>
          </Link>
        </nav>

        <button className="portal-logout" onClick={logout}><ExitIcon /><span>{t.portal.logout}</span></button>
      </aside>

      <div className="portal-main">
        <div className="portal-topbar">
          <button className="portal-burger" onClick={() => setNavOpen((o) => !o)}
            aria-label={navOpen ? t.nav.closeMenu : t.nav.openMenu}>
            <MenuIcon open={navOpen} />
          </button>
          <LanguageSwitcher />
        </div>

        <Routes>
          <Route index element={<AdminModules />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="resources" element={<AdminResources />} />
          <Route path="participants" element={<AdminParticipants />} />
          <Route path="applications" element={<AdminApplicationSettings />} />
          <Route path="submissions" element={<AdminApplicationSubmissions />} />
          <Route path="knowledge" element={<AdminKnowledgeBase />} />
        </Routes>
      </div>

      {navOpen && <div className="portal-scrim" onClick={() => setNavOpen(false)} />}
    </div>
  );
}
