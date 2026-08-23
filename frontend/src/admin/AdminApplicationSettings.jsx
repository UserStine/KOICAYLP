import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Loading, ErrorNote } from "../lms/useApi";

const MAX_FORM_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx"]);

const blank = {
  applicationsOpen: false,
  closedMessage: "Applications are currently closed.",
  closeAt: "",
  publicFormName: "",
  privateFormName: "",
};

function toLocalDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected application form."));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminApplicationSettings() {
  const { api } = useAuth();
  const [form, setForm] = useState(blank);
  const [initial, setInitial] = useState(blank);
  const [selectedFiles, setSelectedFiles] = useState({ public: null, private: null });
  const [uploading, setUploading] = useState("");
  const [removing, setRemoving] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const publicInput = useRef(null);
  const privateInput = useRef(null);

  const applySettings = (settings) => {
    const next = { ...blank, ...settings, closeAt: toLocalDateTime(settings?.closeAt) };
    setForm(next);
    setInitial(next);
    setSelectedFiles({ public: null, private: null });
  };

  useEffect(() => {
    api("/api/admin/application-settings")
      .then(({ settings }) => applySettings(settings))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [api]);

  const editableForm = useMemo(() => ({
    applicationsOpen: form.applicationsOpen,
    closedMessage: form.closedMessage,
    closeAt: form.closeAt,
  }), [form]);

  const editableInitial = useMemo(() => ({
    applicationsOpen: initial.applicationsOpen,
    closedMessage: initial.closedMessage,
    closeAt: initial.closeAt,
  }), [initial]);

  const changed = useMemo(
    () => JSON.stringify(editableForm) !== JSON.stringify(editableInitial),
    [editableForm, editableInitial]
  );

  const set = (key, value) => {
    setSuccess("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const chooseForm = (track, file) => {
    setError("");
    setSuccess("");
    if (!file) {
      setSelectedFiles((current) => ({ ...current, [track]: null }));
      return;
    }
    const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      setError("Application forms must be PDF, DOC, or DOCX files.");
      return;
    }
    if (file.size > MAX_FORM_BYTES) {
      setError("Application forms must be 10 MB or smaller.");
      return;
    }
    setSelectedFiles((current) => ({ ...current, [track]: file }));
  };

  const uploadForm = async (track) => {
    const file = selectedFiles[track];
    if (!file) return setError("Choose a PDF, DOC, or DOCX file first.");
    setUploading(track);
    setError("");
    setSuccess("");
    try {
      const dataUrl = await fileToDataUrl(file);
      const data = await api(`/api/admin/application-settings/form/${track}`, {
        method: "POST",
        body: JSON.stringify({ file: { name: file.name, mime: file.type || "application/octet-stream", size: file.size, dataUrl } }),
      });
      applySettings(data.settings);
      setSuccess(`${track === "public" ? "Public" : "Private"} Sector application form uploaded successfully.`);
      const input = track === "public" ? publicInput.current : privateInput.current;
      if (input) input.value = "";
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading("");
    }
  };

  const removeForm = async (track) => {
    const label = track === "public" ? "Public Sector" : "Private Sector";
    if (!window.confirm(`Remove the ${label} application form?\n\nThe Download button will remain unavailable until another form is uploaded.`)) return;
    setRemoving(track);
    setError("");
    setSuccess("");
    try {
      const data = await api(`/api/admin/application-settings/form/${track}`, { method: "DELETE" });
      applySettings(data.settings);
      setSuccess(`${label} application form removed.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setRemoving("");
    }
  };

  const save = async () => {
    if (form.applicationsOpen !== initial.applicationsOpen) {
      const action = form.applicationsOpen ? "OPEN" : "CLOSE";
      const ok = window.confirm(`${action} applications now?\n\nThis change will affect the public Apply page immediately.`);
      if (!ok) return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        applicationsOpen: form.applicationsOpen,
        closedMessage: form.closedMessage,
        closeAt: fromLocalDateTime(form.closeAt),
      };
      const data = await api("/api/admin/application-settings", { method: "PUT", body: JSON.stringify(payload) });
      applySettings(data.settings);
      setSuccess("Application settings saved. The public Apply page now uses these values.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  const renderUpload = (track) => {
    const isPublic = track === "public";
    const currentName = isPublic ? form.publicFormName : form.privateFormName;
    const selected = selectedFiles[track];
    const inputRef = isPublic ? publicInput : privateInput;
    return (
      <div className="application-form-upload">
        <span className="field-label">Application form</span>
        <div className="application-file-picker">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => chooseForm(track, e.target.files?.[0] || null)}
          />
          <p className="field-hint">Upload PDF, DOC, or DOCX. Maximum 10 MB.</p>
        </div>
        {selected && (
          <div className="application-file-current pending">
            <span className="application-file-badge">NEW</span>
            <div><strong>{selected.name}</strong><small>{formatBytes(selected.size)}</small></div>
          </div>
        )}
        {currentName && !selected && (
          <div className="application-file-current">
            <span className="application-file-badge">FILE</span>
            <div><strong>{currentName}</strong><small>Currently available to applicants when applications are open.</small></div>
          </div>
        )}
        {!currentName && !selected && <p className="application-no-file">No application form uploaded.</p>}
        <div className="application-upload-actions">
          <button type="button" className="btn small" disabled={!selected || uploading === track} onClick={() => uploadForm(track)}>
            <span>{uploading === track ? "Uploading..." : currentName ? "Replace form" : "Upload form"}</span>
          </button>
          {currentName && (
            <button type="button" className="btn small ghost" disabled={removing === track} onClick={() => removeForm(track)}>
              <span>{removing === track ? "Removing..." : "Remove form"}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="portal-page">
      <header className="portal-head admin-head">
        <div>
          <p className="portal-eyebrow">Admin</p>
          <h1>Application Settings</h1>
          <p className="portal-sub">Open or close applications and upload the application documents. Completed applications are submitted directly through the website.</p>
        </div>
        <span className={`app-status-pill ${form.applicationsOpen ? "open" : "closed"}`}>
          {form.applicationsOpen ? "Applications open" : "Applications closed"}
        </span>
      </header>

      {error && <ErrorNote>{error}</ErrorNote>}
      {success && <div className="admin-success" role="status">{success}</div>}

      <div className="admin-form application-settings-form">
        <div className="application-switch-row">
          <div>
            <h2>Application availability</h2>
            <p className="field-hint app-setting-hint">Turn this on only when applicants should be able to use the Download and Submit buttons.</p>
          </div>
          <label className="switch-control">
            <input type="checkbox" checked={form.applicationsOpen} onChange={(e) => set("applicationsOpen", e.target.checked)} />
            <span className="switch-track"><span className="switch-thumb" /></span>
            <span>{form.applicationsOpen ? "Open" : "Closed"}</span>
          </label>
        </div>

        <label className="field">
          <span>Closed message</span>
          <textarea rows="3" maxLength="300" value={form.closedMessage} onChange={(e) => set("closedMessage", e.target.value)} />
        </label>

        <label className="field">
          <span>Automatic closing date and time <small>(optional)</small></span>
          <input type="datetime-local" value={form.closeAt} onChange={(e) => set("closeAt", e.target.value)} />
        </label>

        <div className="settings-section-title">Public Sector</div>
        <div className="application-track-settings single">
          {renderUpload("public")}
        </div>

        <div className="settings-section-title">Private Sector</div>
        <div className="application-track-settings single">
          {renderUpload("private")}
        </div>

        <div className="form-actions settings-save-row">
          <button className="btn" onClick={save} disabled={saving || !changed}><span>{saving ? "Saving..." : "Save settings"}</span></button>
          {changed && <span className="unsaved-note">Unsaved changes</span>}
        </div>
      </div>
    </div>
  );
}
