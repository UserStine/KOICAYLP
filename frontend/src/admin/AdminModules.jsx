import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../i18n";
import { Loading, ErrorNote } from "../lms/useApi";

const blankLesson = () => ({ id: "", title: "", type: "reading", minutes: 20, time: "", facilitator: "" });
const blankModule = () => ({
  id: "", title: "", summary: "", phase: "Online Training", track: "",
  lessons: [blankLesson()], presentations: [], presentationUploads: [],
});

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("Could not read the selected module file."));
  reader.readAsDataURL(file);
});

export default function AdminModules() {
  const { api } = useAuth();
  const { t } = useT();
  const a = t.admin;
  const [modules, setModules] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    api("/api/admin/content")
      .then((d) => setModules(d.modules || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setSaving(true); setError("");
    try {
      const payload = { ...draft };
      delete payload.presentationUploads;
      if (draft.presentationUploads?.length) {
        setUploading(true);
        payload.presentationUploads = await Promise.all(draft.presentationUploads.map(async (file) => ({
          name: file.name,
          mime: file.type || "application/octet-stream",
          dataUrl: await fileToDataUrl(file),
        })));
      }
      const d = await api("/api/admin/modules", { method: "POST", body: JSON.stringify(payload) });
      setModules(d.modules);
      setDraft(null);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); setUploading(false); }
  };

  const remove = async (id) => {
    if (!window.confirm(a.confirmDelete)) return;
    try {
      const d = await api(`/api/admin/modules/${id}`, { method: "DELETE" });
      setModules(d.modules);
    } catch (e) { setError(e.message); }
  };

  const setL = (i, patch) =>
    setDraft((d) => ({ ...d, lessons: d.lessons.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  if (loading) return <Loading />;

  return (
    <div className="portal-page">
      <header className="portal-head admin-head">
        <div>
          <p className="portal-eyebrow">{a.badge}</p>
          <h1>{a.modulesTitle}</h1>
          <p className="portal-sub">{a.modulesSub}</p>
        </div>
        <button className="btn" onClick={() => setDraft(blankModule())}>
          <span>+ {a.newModule}</span>
        </button>
      </header>

      {error && <ErrorNote>{error}</ErrorNote>}

      {draft && (
        <div className="admin-form">
          <h2>{draft.id ? a.editModule : a.newModule}</h2>

          <div className="form-row">
            <label className="field">
              <span>{a.fTitle}</span>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder={a.phTitle} />
            </label>
            <label className="field">
              <span>{a.fPhase}</span>
              <select value={draft.phase} onChange={(e) => setDraft({ ...draft, phase: e.target.value })}>
                <option>Online Training</option>
                <option>Local Training</option>
                <option>Invitational Training</option>
              </select>
            </label>
            <label className="field">
              <span>{a.fTrack}</span>
              <select value={draft.track} onChange={(e) => setDraft({ ...draft, track: e.target.value })}>
                <option value="">{a.bothTracks}</option>
                <option value="public">{t.portal.trackPublic}</option>
                <option value="private">{t.portal.trackPrivate}</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>{a.fSummary}</span>
            <textarea rows="2" value={draft.summary}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              placeholder={a.phSummary} />
          </label>


          <div className="module-presentations-editor">
            <div className="le-head">
              <span>{a.presentations}</span>
            </div>
            <label className="field module-presentation-upload">
              <span>{a.presentationFiles}</span>
              <input
                type="file"
                accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                multiple
                onChange={(e) => setDraft({ ...draft, presentationUploads: Array.from(e.target.files || []) })}
              />
            </label>
            <p className="field-hint">{a.presentationHint}</p>

            {!!draft.presentationUploads?.length && (
              <div className="presentation-file-list pending">
                {draft.presentationUploads.map((file, i) => (
                  <div className="presentation-file-row" key={`${file.name}-${i}`}>
                    <span className="presentation-file-icon">{file.name.toLowerCase().endsWith(".pdf") ? "PDF" : "P"}</span>
                    <span>{file.name}</span>
                    <button type="button" className="le-del" aria-label={a.remove}
                      onClick={() => setDraft({ ...draft, presentationUploads: draft.presentationUploads.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
              </div>
            )}

            {!!draft.presentations?.length && (
              <div className="presentation-file-list">
                <small className="presentation-list-label">{a.currentPresentations}</small>
                {draft.presentations.map((file) => (
                  <div className="presentation-file-row" key={file.id}>
                    <span className="presentation-file-icon">{file.originalFileName?.toLowerCase().endsWith(".pdf") ? "PDF" : "P"}</span>
                    <span>{file.originalFileName}</span>
                    <button type="button" className="le-del" aria-label={a.remove}
                      onClick={() => setDraft({ ...draft, presentations: draft.presentations.filter((p) => p.id !== file.id) })}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lessons-editor">
            <div className="le-head">
              <span>{a.lessons}</span>
              <button className="link-btn"
                onClick={() => setDraft({ ...draft, lessons: [...draft.lessons, blankLesson()] })}>
                + {a.addLesson}
              </button>
            </div>
            {draft.lessons.map((l, i) => (
              <div key={i} className="le-row">
                <span className="le-num">{i + 1}</span>
                <input className="le-title" value={l.title} placeholder={a.phLesson}
                  onChange={(e) => setL(i, { title: e.target.value })} />
                <select value={l.type} onChange={(e) => setL(i, { type: e.target.value })}>
                  <option value="reading">{a.tReading}</option>
                  <option value="video">{a.tVideo}</option>
                  <option value="task">{a.tTask}</option>
                  <option value="lecture">Lecture</option>
                  <option value="workshop">Workshop</option>
                  <option value="visit">Institution / Cultural Visit</option>
                  <option value="event">Programme Event</option>
                  <option value="self-study">Self-Directed Learning</option>
                </select>
                <input className="le-min" type="number" min="0" value={l.minutes}
                  onChange={(e) => setL(i, { minutes: e.target.value })} />
                <input className="le-time" value={l.time || ""} placeholder="Time" onChange={(e) => setL(i, { time: e.target.value })} />
                <input className="le-facilitator" value={l.facilitator || ""} placeholder="Facilitator" onChange={(e) => setL(i, { facilitator: e.target.value })} />
                <button className="le-del" aria-label={a.remove}
                  onClick={() => setDraft({ ...draft, lessons: draft.lessons.filter((_, j) => j !== i) })}>
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button className="btn" onClick={save} disabled={saving}>
              <span>{uploading ? a.uploading : saving ? a.saving : a.save}</span>
            </button>
            <button className="btn ghost" onClick={() => setDraft(null)}><span>{a.cancel}</span></button>
          </div>
        </div>
      )}

      <div className="admin-list">
        {modules.map((m) => (
          <div key={m.id} className="admin-row">
            <div className="ar-main">
              <div className="ar-tags">
                <span className="phase-chip">{m.phase}</span>
                <span className={`track-chip ${m.track || "both"}`}>
                  {m.track === "public" ? t.portal.trackPublic
                    : m.track === "private" ? t.portal.trackPrivate : a.bothTracks}
                </span>
              </div>
              <h3>{m.title}</h3>
              <p>{m.summary}</p>
              <small>{m.lessons.length} {a.lessonsCount}</small>
            </div>
            <div className="ar-actions">
              <button className="btn small ghost"
                onClick={() => setDraft({ ...m, track: m.track || "", presentations: m.presentations || [], presentationUploads: [] })}>
                <span>{a.edit}</span>
              </button>
              <button className="btn small danger" onClick={() => remove(m.id)}>
                <span>{a.delete}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
