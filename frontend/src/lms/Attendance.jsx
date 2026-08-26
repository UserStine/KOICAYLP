import { useT } from "../i18n";

const ATTENDANCE_URL =
  import.meta.env.VITE_ATTENDANCE_URL || "https://koica-attendance.vercel.app/";

const AttendanceIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M8 2v4M16 2v4M3 9h18" />
    <path d="m8.5 15 2.2 2.2 4.8-5" />
  </svg>
);

export default function Attendance() {
  const { t } = useT();
  const a = t.portal.attendance;

  return (
    <div className="portal-page attendance-page">
      <header className="portal-head">
        <div>
          <span className="eyebrow">{a.eyebrow}</span>
          <h1>{a.title}</h1>
          <p>{a.sub}</p>
        </div>
      </header>

      <section className="attendance-card">
        <div className="attendance-card-icon"><AttendanceIcon /></div>
        <div className="attendance-card-body">
          <h2>{a.cardTitle}</h2>
          <p>{a.cardText}</p>
          <ul className="attendance-points">
            <li>{a.point1}</li>
            <li>{a.point2}</li>
            <li>{a.point3}</li>
          </ul>
          <a className="btn attendance-launch" href={ATTENDANCE_URL} target="_blank" rel="noopener noreferrer">
            {a.open}
          </a>
          <small>{a.note}</small>
        </div>
      </section>
    </div>
  );
}
