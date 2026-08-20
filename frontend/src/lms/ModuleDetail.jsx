import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import useApi, { Loading, ErrorNote } from "./useApi";
import { useAuth, API } from "../auth/AuthContext";
import { useT } from "../i18n";

const TypeIcon = ({ type }) => {
  const common = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "video") return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10.5 9.5l5 2.5-5 2.5z" /></svg>;
  if (type === "task") return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 12.5l2.4 2.4L15.8 9.5" /></svg>;
  if (type === "workshop") return <svg {...common}><path d="M4 20h16M6 16l4-4 3 3 5-7"/><circle cx="6" cy="8" r="2"/></svg>;
  if (type === "visit") return <svg {...common}><path d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-5h6v5"/></svg>;
  if (type === "event") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>;
  if (type === "self-study") return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M8 8h7M8 12h7"/></svg>;
  if (type === "lecture") return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M9 7h7M9 11h7"/></svg>;
  return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" /></svg>;
};

export default function ModuleDetail() {
  const { id } = useParams();
  const { api, token } = useAuth();
  const { data, error, loading } = useApi(`/api/modules/${id}`);
  const { t } = useT();
  const p = t.portal;
  const [lessons, setLessons] = useState([]);
  const [saving, setSaving] = useState("");
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => { if (data) setLessons(data.module.lessons); }, [data]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const mod = data.module;
  const done = lessons.filter((l) => l.done).length;
  const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;

  const toggle = async (lesson) => {
    const next = !lesson.done;
    setLessons((ls) => ls.map((l) => (l.id === lesson.id ? { ...l, done: next } : l)));
    setSaving(lesson.id);
    try {
      await api("/api/progress", {
        method: "POST",
        body: JSON.stringify({ moduleId: mod.id, lessonId: lesson.id, done: next }),
      });
    } catch {
      /* roll back if the save failed */
      setLessons((ls) => ls.map((l) => (l.id === lesson.id ? { ...l, done: !next } : l)));
    } finally {
      setSaving("");
    }
  };


  const downloadPresentation = async (presentation) => {
    setDownloadError("");
    setDownloading(presentation.id);
    try {
      const response = await fetch(`${API}/api/modules/${mod.id}/presentations/${presentation.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Download failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = presentation.originalFileName || "module-file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDownloadError(e.message);
    } finally {
      setDownloading("");
    }
  };

  return (
    <div className="portal-page">
      <Link className="back-link" to="/portal/modules">← {p.nav.modules}</Link>

      <header className="portal-head">
        <div>
          <span className="phase-chip">{mod.phase}</span>
          <h1>{mod.title}</h1>
          <p className="portal-sub">{mod.summary}</p>
        </div>
      </header>

      {downloadError && <ErrorNote>{downloadError}</ErrorNote>}

      <div className="mod-progress">
        <div className="bar"><span style={{ width: `${percent}%` }} /></div>
        <small>{p.lessonsDone.replace("{done}", done).replace("{total}", lessons.length)}</small>
      </div>


      {!!mod.presentations?.length && (
        <section className="module-presentations">
          <div className="module-presentations-head">
            <div>
              <p className="portal-eyebrow">{p.presentationMaterials}</p>
              <h2>{p.downloadPresentations}</h2>
            </div>
          </div>
          <div className="module-presentation-grid">
            {mod.presentations.map((presentation) => (
              <button key={presentation.id} className="module-presentation-card"
                onClick={() => downloadPresentation(presentation)} disabled={downloading === presentation.id}>
                <span className="presentation-file-icon">{presentation.originalFileName?.toLowerCase().endsWith(".pdf") ? "PDF" : "P"}</span>
                <span className="module-presentation-name">
                  <strong>{presentation.originalFileName}</strong>
                  <small>{presentation.size ? `${Math.max(1, Math.round(presentation.size / 1024))} KB` : p.moduleFile}</small>
                </span>
                <span className="module-presentation-action">{downloading === presentation.id ? p.downloading : p.download}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <ul className="lesson-list">
        {lessons.map((l) => (
          <li key={l.id} className={`lesson${l.done ? " done" : ""}`}>
            <button className="lesson-check" onClick={() => toggle(l)}
              aria-pressed={l.done} aria-label={l.done ? p.markUndone : p.markDone}
              disabled={saving === l.id}>
              {l.done ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="3" strokeLinecap="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
              ) : null}
            </button>
            <span className="lesson-type"><TypeIcon type={l.type} /></span>
            <span className="lesson-title"><strong>{l.title}</strong>{(l.time || l.facilitator) && <small className="lesson-meta">{[l.time, l.facilitator].filter(Boolean).join(" · ")}</small>}</span>
            {l.minutes > 0 && <span className="lesson-min">{l.minutes} {p.min}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
