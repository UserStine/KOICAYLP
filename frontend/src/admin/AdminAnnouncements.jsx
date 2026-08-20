import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../i18n";
import { Loading, ErrorNote } from "../lms/useApi";

const blank = () => ({ id: "", title: "", body: "", tag: "News" });

export default function AdminAnnouncements() {
  const { api } = useAuth();
  const { t } = useT();
  const a = t.admin;
  const [list, setList] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/api/admin/content")
      .then((d) => setList(d.announcements || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setSaving(true); setError("");
    try {
      const d = await api("/api/admin/announcements", { method: "POST", body: JSON.stringify(draft) });
      setList(d.announcements); setDraft(null);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm(a.confirmDelete)) return;
    try {
      const d = await api(`/api/admin/announcements/${id}`, { method: "DELETE" });
      setList(d.announcements);
    } catch (e) { setError(e.message); }
  };

  if (loading) return <Loading />;

  return (
    <div className="portal-page">
      <header className="portal-head admin-head">
        <div>
          <p className="portal-eyebrow">{a.badge}</p>
          <h1>{a.annTitle}</h1>
          <p className="portal-sub">{a.annSub}</p>
        </div>
        <button className="btn" onClick={() => setDraft(blank())}><span>+ {a.newAnn}</span></button>
      </header>

      {error && <ErrorNote>{error}</ErrorNote>}

      {draft && (
        <div className="admin-form">
          <h2>{draft.id ? a.editAnn : a.newAnn}</h2>
          <div className="form-row">
            <label className="field grow">
              <span>{a.fTitle}</span>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label className="field">
              <span>{a.fTag}</span>
              <input value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                placeholder="News" />
            </label>
          </div>
          <label className="field">
            <span>{a.fBody}</span>
            <textarea rows="3" value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </label>
          <div className="form-actions">
            <button className="btn" onClick={save} disabled={saving}>
              <span>{saving ? a.saving : a.save}</span>
            </button>
            <button className="btn ghost" onClick={() => setDraft(null)}><span>{a.cancel}</span></button>
          </div>
        </div>
      )}

      <div className="admin-list">
        {list.map((x) => (
          <div key={x.id} className="admin-row">
            <div className="ar-main">
              <span className="ann-tag">{x.tag}</span>
              <h3>{x.title}</h3>
              <p>{x.body}</p>
            </div>
            <div className="ar-actions">
              <button className="btn small ghost" onClick={() => setDraft(x)}><span>{a.edit}</span></button>
              <button className="btn small danger" onClick={() => remove(x.id)}><span>{a.delete}</span></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
