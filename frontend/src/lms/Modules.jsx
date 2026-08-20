import { Link } from "react-router-dom";
import useApi, { Loading, ErrorNote } from "./useApi";
import { useT } from "../i18n";

export default function Modules() {
  const { data, error, loading } = useApi("/api/dashboard");
  const { t } = useT();
  const p = t.portal;

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <div className="portal-page">
      <header className="portal-head">
        <div>
          <p className="portal-eyebrow">{p.nav.modules}</p>
          <h1>{p.modulesTitle}</h1>
        </div>
      </header>

      <div className="mod-grid">
        {data.modules.map((m) => (
          <Link key={m.id} className="mod-card" to={`/portal/modules/${m.id}`}>
            <span className="phase-chip">{m.phase}</span>
            <h3>{m.title}</h3>
            <p>{m.summary}</p>
            <div className="mod-foot">
              <div className="bar"><span style={{ width: `${m.percent}%` }} /></div>
              <small>{m.completed}/{m.total}</small>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
