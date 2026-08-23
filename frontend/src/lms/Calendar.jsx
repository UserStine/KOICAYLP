import useApi, { Loading, ErrorNote } from "./useApi";

function formatRange(days) {
  if (!days.length) return "No programme dates yet";
  const first = new Date(`${days[0].date}T00:00:00Z`);
  const last = new Date(`${days[days.length - 1].date}T00:00:00Z`);
  const options = { day: "numeric", month: "short", timeZone: "UTC" };
  return `${first.toLocaleDateString(undefined, options)} – ${last.toLocaleDateString(undefined, options)}`;
}

export default function Calendar() {
  const { data, error, loading } = useApi("/api/calendar");
  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const days = data?.days || [];
  const sessionCount = days.reduce((total, day) => total + (day.events?.length || 0), 0);

  return (
    <div className="portal-page calendar-page">
      <header className="portal-head calendar-head">
        <div>
          <p className="portal-eyebrow">PROGRAM SCHEDULE</p>
          <h1>Programme Calendar</h1>
          <p className="portal-sub">A clear day-by-day view of sessions, times, and facilitators.</p>
        </div>
      </header>

      <div className="calendar-summary" aria-label="Programme calendar summary">
        <div className="calendar-summary-item">
          <span>Programme days</span>
          <strong>{days.length}</strong>
        </div>
        <div className="calendar-summary-item">
          <span>Sessions</span>
          <strong>{sessionCount}</strong>
        </div>
        <div className="calendar-summary-item wide">
          <span>Date range</span>
          <strong>{formatRange(days)}</strong>
        </div>
      </div>

      <div className="daily-calendar">
        {days.map((day, index) => {
          const date = new Date(`${day.date}T00:00:00Z`);
          const month = date.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });
          const weekday = date.toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" });

          return (
            <section className="calendar-day" key={day.date}>
              <div className="calendar-rail" aria-hidden="true">
                <span className="calendar-dot" />
                {index < days.length - 1 && <span className="calendar-line" />}
              </div>

              <div className="calendar-date-card">
                <span className="calendar-month">{month}</span>
                <strong>{String(date.getUTCDate()).padStart(2, "0")}</strong>
                <span className="calendar-weekday">{weekday}</span>
              </div>

              <div className="calendar-day-content">
                <div className="calendar-day-head">
                  <div>
                    <span className="calendar-day-label">Day {String(day.dayNumber).padStart(2, "0")}</span>
                    <h2>{day.label || `Programme Day ${day.dayNumber}`}</h2>
                  </div>
                  <span className="calendar-session-count">{day.events?.length || 0} session{day.events?.length === 1 ? "" : "s"}</span>
                </div>

                <div className="calendar-events">
                  {(day.events || []).map((event, eventIndex) => (
                    <article className="calendar-event" key={`${day.moduleId}:${event.id}`}>
                      <div className="calendar-event-time">
                        <span>{event.time || "All day"}</span>
                      </div>
                      <div className="calendar-event-body">
                        <div className="calendar-event-number">{String(eventIndex + 1).padStart(2, "0")}</div>
                        <div>
                          <strong>{event.title}</strong>
                          {event.facilitator && <small>{event.facilitator}</small>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {!days.length && (
          <div className="calendar-empty">
            <strong>No programme dates yet</strong>
            <span>Dated programme days will appear here once they are configured.</span>
          </div>
        )}
      </div>
    </div>
  );
}
