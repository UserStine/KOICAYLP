import useApi, { Loading, ErrorNote } from "./useApi";
import { useT } from "../i18n";

function formatRange(days, locale, emptyText) {
  if (!days.length) return emptyText;
  const first = new Date(`${days[0].date}T00:00:00Z`);
  const last = new Date(`${days[days.length - 1].date}T00:00:00Z`);
  const options = { day: "numeric", month: "short", timeZone: "UTC" };
  return `${first.toLocaleDateString(locale, options)} – ${last.toLocaleDateString(locale, options)}`;
}

export default function Calendar() {
  const { t, lang } = useT();
  const c = t.portal.calendar;
  const locale = lang === "fr" ? "fr-FR" : lang === "ko" ? "ko-KR" : "en-GB";
  const { data, error, loading } = useApi("/api/calendar");
  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const days = data?.days || [];
  const sessionCount = days.reduce((total, day) => total + (day.events?.length || 0), 0);

  return (
    <div className="portal-page calendar-page">
      <header className="portal-head calendar-head">
        <div>
          <p className="portal-eyebrow">{c.eyebrow}</p>
          <h1>{c.title}</h1>
          <p className="portal-sub">{c.sub}</p>
        </div>
      </header>

      <div className="calendar-summary" aria-label={c.summaryAria}>
        <div className="calendar-summary-item">
          <span>{c.days}</span>
          <strong>{days.length}</strong>
        </div>
        <div className="calendar-summary-item">
          <span>{c.sessions}</span>
          <strong>{sessionCount}</strong>
        </div>
        <div className="calendar-summary-item wide">
          <span>{c.range}</span>
          <strong>{formatRange(days, locale, c.emptyTitle)}</strong>
        </div>
      </div>

      <div className="daily-calendar">
        {days.map((day, index) => {
          const date = new Date(`${day.date}T00:00:00Z`);
          const month = date.toLocaleDateString(locale, { month: "short", timeZone: "UTC" });
          const weekday = date.toLocaleDateString(locale, { weekday: "long", timeZone: "UTC" });

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
                    <span className="calendar-day-label">{c.day} {String(day.dayNumber).padStart(2, "0")}</span>
                    <h2>{day.label || `${c.day} ${day.dayNumber}`}</h2>
                  </div>
                  <span className="calendar-session-count">{day.events?.length || 0} {day.events?.length === 1 ? c.session : c.sessionsLower}</span>
                </div>

                <div className="calendar-events">
                  {(day.events || []).map((event, eventIndex) => (
                    <article className="calendar-event" key={`${day.moduleId}:${event.id}`}>
                      <div className="calendar-event-time">
                        <span>{event.time || c.allDay}</span>
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
            <strong>{c.emptyTitle}</strong>
            <span>{c.emptyText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
