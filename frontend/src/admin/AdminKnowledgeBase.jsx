import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../i18n";
import { Loading, ErrorNote } from "../lms/useApi";

const blank = () => ({ id: "", title: "", category: "program", content: "", language: "en", source: "KOICA YLP knowledge base", isPublished: false });

export default function AdminKnowledgeBase() {
  const { api } = useAuth();
  const { t } = useT();
  const a = t.admin;
  const k = a.knowledge;
  const [articles, setArticles] = useState([]);
  const [draft, setDraft] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => api("/api/admin/knowledge").then((d) => setArticles(d.articles || []));
  useEffect(() => { load().catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((x) => `${x.title} ${x.category} ${x.content} ${x.source}`.toLowerCase().includes(q));
  }, [articles, search]);

  const save = async () => {
    if (!draft?.title.trim() || !draft?.content.trim()) return setError(k.required);
    setSaving(true); setError("");
    try {
      const { article } = await api("/api/admin/knowledge", { method: "POST", body: JSON.stringify(draft) });
      setArticles((current) => [article, ...current.filter((x) => x.id !== article.id)]);
      setDraft(null);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm(k.confirmDelete)) return;
    try {
      await api(`/api/admin/knowledge/${id}`, { method: "DELETE" });
      setArticles((current) => current.filter((x) => x.id !== id));
    } catch (e) { setError(e.message); }
  };

  const togglePublish = async (article) => {
    try {
      const { article: saved } = await api("/api/admin/knowledge", { method: "POST", body: JSON.stringify({ ...article, isPublished: !article.isPublished }) });
      setArticles((current) => current.map((x) => x.id === saved.id ? saved : x));
    } catch (e) { setError(e.message); }
  };

  if (loading) return <Loading />;

  return <div className="portal-page">
    <header className="portal-head admin-head">
      <div><p className="portal-eyebrow">{a.badge}</p><h1>{k.title}</h1><p className="portal-sub">{k.sub}</p></div>
      <button className="btn" onClick={() => setDraft(blank())}><span>+ {k.newArticle}</span></button>
    </header>
    {error && <ErrorNote>{error}</ErrorNote>}

    {draft && <div className="admin-form knowledge-form">
      <h2>{draft.id ? k.editArticle : k.newArticle}</h2>
      <div className="form-row">
        <label className="field grow"><span>{k.articleTitle}</span><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
        <label className="field"><span>{k.category}</span><input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="eligibility" /></label>
        <label className="field"><span>{k.language}</span><select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value })}><option value="en">English</option><option value="fr">Français</option><option value="ko">한국어</option><option value="all">{k.allLanguages}</option></select></label>
      </div>
      <label className="field"><span>{k.content}</span><textarea rows="9" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></label>
      <div className="form-row">
        <label className="field grow"><span>{k.source}</span><input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} /></label>
        <label className="knowledge-publish-check"><input type="checkbox" checked={draft.isPublished} onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })} /><span>{k.published}</span></label>
      </div>
      <div className="form-actions"><button className="btn" onClick={save} disabled={saving}><span>{saving ? a.saving : a.save}</span></button><button className="btn ghost" onClick={() => setDraft(null)}><span>{a.cancel}</span></button></div>
    </div>}

    <div className="knowledge-toolbar"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={k.search} /><span>{articles.filter((x) => x.isPublished).length} {k.publishedCount}</span></div>
    <div className="admin-list knowledge-list">
      {filtered.map((x) => <article key={x.id} className="admin-row knowledge-row">
        <div className="ar-main">
          <div className="knowledge-meta"><span className={`knowledge-status ${x.isPublished ? "live" : "draft"}`}>{x.isPublished ? k.live : k.draft}</span><span>{x.category}</span><span>{x.language.toUpperCase()}</span></div>
          <h3>{x.title}</h3><p>{x.content}</p><small>{k.source}: {x.source}</small>
        </div>
        <div className="ar-actions"><button className="btn small ghost" onClick={() => togglePublish(x)}><span>{x.isPublished ? k.unpublish : k.publish}</span></button><button className="btn small ghost" onClick={() => setDraft({ ...x })}><span>{a.edit}</span></button><button className="btn small danger" onClick={() => remove(x.id)}><span>{a.delete}</span></button></div>
      </article>)}
      {!filtered.length && <div className="admin-empty">{k.empty}</div>}
    </div>
  </div>;
}
