import useApi, { Loading, ErrorNote } from "./useApi";

export default function Calendar() {
  const { data, error, loading } = useApi("/api/calendar");
  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const days = data?.days || [];
  return (
    <div className="portal-page">
      <header className="portal-head"><div><p className="portal-eyebrow">PROGRAM SCHEDULE</p><h1>Daily Calendar</h1><p className="portal-sub">Every programme day, session time, and facilitator in one place.</p></div></header>
      <div className="daily-calendar">
        {days.map((day) => {
          const date = new Date(`${day.date}T00:00:00Z`);
          return (
            <section className="calendar-day" key={day.date}>
              <div className="calendar-date"><strong>{String(date.getUTCDate()).padStart(2,"0")}</strong><span>{date.toLocaleDateString(undefined,{month:"short",weekday:"short",timeZone:"UTC"})}</span></div>
              <div className="calendar-events">
                <h2>Day {String(day.dayNumber).padStart(2,"0")}</h2>
                {day.events.map((event) => <div className="calendar-event" key={`${day.moduleId}:${event.id}`}><time>{event.time || "All day"}</time><div><strong>{event.title}</strong>{event.facilitator && <small>{event.facilitator}</small>}</div></div>)}
              </div>
            </section>
          );
        })}
        {!days.length && <p>No dated programme days have been configured yet.</p>}
      </div>
    </div>
  );
}
