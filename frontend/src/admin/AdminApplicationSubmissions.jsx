import { useMemo, useState } from "react";
import useApi, { Loading, ErrorNote } from "../lms/useApi";
import { API } from "../auth/AuthContext";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function formatSize(bytes) {
  const n = Number(bytes || 0);
  if (!n) return "-";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminApplicationSubmissions() {
  const { data, error, loading } = useApi("/api/admin/application-submissions");
  const [q, setQ] = useState("");
  const [track, setTrack] = useState("all");

  const rows = useMemo(() => {
    const source = data?.submissions || [];
    const query = q.trim().toLowerCase();
    return source.filter((item) => {
      if (track !== "all" && item.track !== track) return false;
      if (!query) return true;
      return `${item.reference} ${item.full_name} ${item.email} ${item.country} ${item.organization}`
        .toLowerCase()
        .includes(query);
    });
  }, [data, q, track]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <div className="portal-page">
      <header className="portal-head admin-submissions-head">
        <div>
          <p className="portal-eyebrow">Admin console</p>
          <h1>Application Submissions</h1>
          <p className="portal-sub">Review and download completed applications submitted through the website.</p>
        </div>
        <span className="submission-count">{rows.length} submission{rows.length === 1 ? "" : "s"}</span>
      </header>

      <div className="submission-filters">
        <input
          className="admin-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, country or reference"
        />
        <select value={track} onChange={(e) => setTrack(e.target.value)}>
          <option value="all">All tracks</option>
          <option value="public">Public Sector</option>
          <option value="private">Private Sector</option>
        </select>
      </div>

      <div className="submission-table-wrap">
        <table className="submission-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Applicant</th>
              <th>Track</th>
              <th>Country / Organization</th>
              <th>Submitted</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.reference}</strong></td>
                <td>
                  <strong>{item.full_name}</strong>
                  <small>{item.email}</small>
                  <small>{item.phone}</small>
                </td>
                <td><span className={`track-pill ${item.track}`}>{item.track === "private" ? "Private" : "Public"}</span></td>
                <td>
                  <span>{item.country || "-"}</span>
                  <small>{item.organization || "-"}</small>
                </td>
                <td>{formatDate(item.submitted_at)}</td>
                <td>
                  <a
                    className="btn small"
                    href={`${API}/api/admin/application-submissions/${item.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                  <small>{item.file_name} · {formatSize(item.file_size)}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="ppl-empty">No application submissions found.</p>}
      </div>
    </div>
  );
}
