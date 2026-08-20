import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../i18n";
import { Loading, ErrorNote } from "../lms/useApi";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const blank = () => ({ id: "", title: "", type: "", note: "", track: "", file: null, fileName: "" });

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes = 0) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminResources() {
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
      .then((d) => setList(d.resources || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chooseFile = (file) => {
    setError("");
    if (!file) return setDraft({ ...draft, file: null });
    if (file.size > MAX_FILE_SIZE) {
      setError(a.fileTooLarge || "Files must be 50 MB or smaller.");
      return;
    }
    const ext = file.name.includes(".") ? file.name.split(".").pop().toUpperCase() : "FILE";
    setDraft({ ...draft, file, fileName: file.name, type: ext });
  };

  const save = async () => {
    if (!draft.title.trim()) return setError(a.titleRequired || "Enter a resource title.");
    if (!draft.id && !draft.file) return setError(a.fileRequired || "Choose a file to upload.");

    setSaving(true); setError("");
    try {
      let file = null;
      if (draft.file) {
        file = {
          name: draft.file.name,
          mime: draft.file.type || "application/octet-stream",
          size: draft.file.size,
          dataUrl: await fileToDataUrl(draft.file),
        };
      }
      const payload = {
        id: draft.id, title: draft.title, type: draft.type, note: draft.note, track: draft.track, file,
      };
      const d = await api("/api/admin/resources", { method: "POST", body: JSON.stringify(payload) });
      setList(d.resources); setDraft(null);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm(a.confirmDelete)) return;
    try {
      const d = await api(`/api/admin/resources/${id}`, { method: "DELETE" });
      setList(d.resources);
    } catch (e) { setError(e.message); }
  };

  if (loading) return <Loading />;

  return (
    <div className="portal-page">
      <header className="portal-head admin-head">
        <div>
          <p className="portal-eyebrow">{a.badge}</p>
          <h1>{a.resTitle}</h1>
          <p className="portal-sub">{a.resSub}</p>
        </div>
        <button className="btn" onClick={() => setDraft(blank())}><span>+ {a.newRes}</span></button>
      </header>

      {error && <ErrorNote>{error}</ErrorNote>}

      {draft && (
        <div className="admin-form">
          <h2>{draft.id ? a.editRes : a.newRes}</h2>
          <div className="form-row">
            <label className="field grow">
              <span>{a.fTitle}</span>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label className="field">
              <span>{a.fType}</span>
              <input value={draft.type} readOnly placeholder="PDF" />
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
            <span>{a.fFile || "Resource file"}</span>
            <input type="file" onChange={(e) => chooseFile(e.target.files?.[0] || null)} />
          </label>
          <p className="field-hint">
            {draft.fileName ? `${draft.fileName}${draft.file ? ` · ${formatBytes(draft.file.size)}` : ""}` : (a.fileHint || "Upload a PDF, Word, PowerPoint, spreadsheet, image, ZIP or video file. Maximum 50 MB.")}
          </p>
          {draft.id && !draft.file && draft.originalFileName && (
            <p className="field-hint"><strong>{a.currentFile || "Current file"}:</strong> {draft.originalFileName}</p>
          )}

          <label className="field">
            <span>{a.fNote}</span>
            <input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          </label>
          <div className="form-actions">
            <button className="btn" onClick={save} disabled={saving}>
              <span>{saving ? (a.uploading || "Uploading…") : a.save}</span>
            </button>
            <button className="btn ghost" onClick={() => setDraft(null)}><span>{a.cancel}</span></button>
          </div>
        </div>
      )}

      <div className="admin-list">
        {list.map((r) => (
          <div key={r.id} className="admin-row">
            <div className="ar-main">
              <div className="ar-tags">
                <span className="res-dl">{r.type || "FILE"}</span>
                <span className={`track-chip ${r.track || "both"}`}>
                  {r.track === "public" ? t.portal.trackPublic : r.track === "private" ? t.portal.trackPrivate : a.bothTracks}
                </span>
              </div>
              <h3>{r.title}</h3>
              <p>{r.note}</p>
              <small className="ar-url">{r.originalFileName || (r.url && r.url !== "#" ? r.url : (a.noFile || "No uploaded file"))}</small>
            </div>
            <div className="ar-actions">
              <button className="btn small ghost" onClick={() => setDraft({ ...r, track: r.track || "", file: null, fileName: "" })}>
                <span>{a.edit}</span>
              </button>
              <button className="btn small danger" onClick={() => remove(r.id)}><span>{a.delete}</span></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
