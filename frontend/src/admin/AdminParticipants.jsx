import { useState } from "react";
import useApi, { Loading, ErrorNote } from "../lms/useApi";
import { useT } from "../i18n";

export default function AdminParticipants() {
  const { data, error, loading } = useApi("/api/admin/participants");
  const { t } = useT();
  const a = t.admin;
  const [q, setQ] = useState("");

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const rows = data.participants.filter((p) =>
    `${p.name} ${p.pin} ${p.country}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="portal-page">
      <header className="portal-head">
        <div>
          <p className="portal-eyebrow">{a.badge}</p>
          <h1>{a.pplTitle}</h1>
          <p className="portal-sub">{a.pplSub}</p>
        </div>
      </header>

      <input className="admin-search" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder={a.search} />

      <div className="ppl-table">
        <div className="ppl-row ppl-head">
          <span>{a.cName}</span><span>{a.cPin}</span><span>{a.cCountry}</span>
          <span>{a.cTrack}</span><span>{a.cProgress}</span>
        </div>
        {rows.map((p) => (
          <div key={p.id} className="ppl-row">
            <span data-c={a.cName}>
              {p.name}
              {p.role === "admin" && <span className="mini-badge">{a.role}</span>}
            </span>
            <span data-c={a.cPin} className="mono">{p.pin}</span>
            <span data-c={a.cCountry}>{p.country || "-"}</span>
            <span data-c={a.cTrack}>
              {p.track === "private" ? t.portal.trackPrivate : t.portal.trackPublic}
            </span>
            <span data-c={a.cProgress} className="ppl-prog">
              <span className="bar"><span style={{ width: `${p.percent}%` }} /></span>
              <small>{p.completed}/{p.total}</small>
            </span>
          </div>
        ))}
        {!rows.length && <p className="ppl-empty">{a.noResults}</p>}
      </div>
    </div>
  );
}
