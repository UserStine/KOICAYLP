import { useState } from "react";
import useApi, { Loading, ErrorNote } from "./useApi";
import { useT } from "../i18n";
import { API } from "../auth/AuthContext";
import { FileIcon, DownloadIcon } from "../components/Icons";

export default function Resources() {
  const { data, error, loading } = useApi("/api/resources");
  const { t } = useT();
  const p = t.portal;
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const download = async (resource) => {
    setDownloadError("");
    setDownloading(resource.id);
    try {
      const res = await fetch(`${API}/api/resources/${resource.id}/download`, { credentials: "include" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Download failed.");
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = resource.originalFileName || resource.title;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e) {
      setDownloadError(e.message);
    } finally {
      setDownloading("");
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <div className="portal-page">
      <header className="portal-head">
        <div>
          <p className="portal-eyebrow">{p.nav.resources}</p>
          <h1>{p.resourcesTitle}</h1>
          <p className="portal-sub">{p.resourcesSub}</p>
        </div>
      </header>

      {downloadError && <ErrorNote>{downloadError}</ErrorNote>}

      <div className="res-grid">
        {data.resources.map((r) => {
          const inner = (
            <>
              <div className="res-icon"><FileIcon /></div>
              <div className="res-text">
                <h3>{r.title}</h3>
                <p>{r.note}</p>
              </div>
              <span className="res-dl"><DownloadIcon /> {downloading === r.id ? "…" : r.type}</span>
            </>
          );

          if (r.filePath) {
            return <button key={r.id} className="res-card res-card-button" type="button" onClick={() => download(r)} disabled={downloading === r.id}>{inner}</button>;
          }

          return <a key={r.id} className="res-card" href={r.url || "#"} target="_blank" rel="noopener noreferrer">{inner}</a>;
        })}
      </div>
    </div>
  );
}
