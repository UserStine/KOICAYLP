import { Link } from "react-router-dom";
import useApi, { Loading, ErrorNote } from "./useApi";
import { useT } from "../i18n";
import { Arrow } from "../components/Icons";

function Ring({ percent }) {
  const R = 46, C = 2 * Math.PI * R;
  return (
    <svg className="ring" viewBox="0 0 110 110" width="110" height="110">
      <circle cx="55" cy="55" r={R} fill="none" stroke="#E1E9F5" strokeWidth="9" />
      <circle cx="55" cy="55" r={R} fill="none" stroke="url(#rg)" strokeWidth="9"
        strokeLinecap="round" strokeDasharray={C}
        strokeDashoffset={C - (C * percent) / 100}
        transform="rotate(-90 55 55)" />
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#004290" /><stop offset="100%" stopColor="#39BCF2" />
        </linearGradient>
      </defs>
      <text x="55" y="60" textAnchor="middle" className="ring-text">{percent}%</text>
    </svg>
  );
}

export default function Dashboard() {
  const { data, error, loading } = useApi("/api/dashboard");
  const { t } = useT();
  const p = t.portal;

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const { user, progress, modules, announcements } = data;
  const first = (user.name || "").split(" ")[0];
  const nextUp = modules.find((m) => m.percent < 100);

  return (
    <div className="portal-page">
      <header className="portal-head">
        <div>
          <p className="portal-eyebrow">{p.dashEyebrow}</p>
          <h1>{p.greeting.replace("{name}", first)}</h1>
        </div>
      </header>

      <section className="portal-cards">
        <div className="pcard progress-card">
          <Ring percent={progress.percent} />
          <div>
            <h3>{p.yourProgress}</h3>
            <p>{p.lessonsDone.replace("{done}", progress.completed).replace("{total}", progress.total)}</p>
          </div>
        </div>

        <div className="pcard stat-card">
          <span className="pstat">{modules.filter((m) => m.percent === 100).length}<small>/{modules.length}</small></span>
          <h3>{p.modulesComplete}</h3>
          <Link className="pcard-link" to="/portal/modules">{p.nav.modules} <Arrow size={13} /></Link>
        </div>

        <div className="pcard stat-card">
          <span className="pstat">{progress.total - progress.completed}</span>
          <h3>{p.lessonsLeft}</h3>
        </div>
      </section>

      {nextUp && (
        <section className="portal-section">
          <h2>{p.continueLearning}</h2>
          <Link className="next-card" to={`/portal/modules/${nextUp.id}`}>
            <div>
              <span className="phase-chip">{nextUp.phase}</span>
              <h3>{nextUp.title}</h3>
              <p>{nextUp.summary}</p>
            </div>
            <div className="next-meta">
              <div className="bar"><span style={{ width: `${nextUp.percent}%` }} /></div>
              <small>{nextUp.completed}/{nextUp.total}</small>
            </div>
          </Link>
        </section>
      )}

      <section className="portal-section">
        <h2>{p.announcements}</h2>
        <div className="ann-list">
          {announcements.map((a) => (
            <div key={a.id} className="ann-card">
              <span className="ann-tag">{a.tag}</span>
              <h3>{a.title}</h3>
              <p>{a.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
