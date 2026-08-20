import { useEffect, useState } from "react";
import { FileIcon, DownloadIcon, MailIcon } from "../components/Icons";
import { useT } from "../i18n";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const CLOSED_STATUS = {
  open: false,
  message: "Applications are closed.",
  closeAt: null,
  forms: { public: "", private: "" },
  submissions: { public: "", private: "" },
};

function ActionButton({ href, disabled, children, secondary = false }) {
  const className = `application-action${secondary ? " secondary" : ""}${disabled ? " disabled" : ""}`;
  if (disabled || !href) {
    return <button type="button" className={className} disabled aria-disabled="true">{children}</button>;
  }
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export default function Apply() {
  const { t } = useT();
  const a = t.apply;
  const [applicationStatus, setApplicationStatus] = useState(CLOSED_STATUS);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/api/application-status`, { signal: controller.signal, credentials: "include" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("status unavailable")))
      .then((data) => setApplicationStatus({ ...CLOSED_STATUS, ...data, forms: { ...CLOSED_STATUS.forms, ...(data.forms || {}) }, submissions: { ...CLOSED_STATUS.submissions, ...(data.submissions || {}) } }))
      .catch((error) => { if (error.name !== "AbortError") setApplicationStatus(CLOSED_STATUS); });
    return () => controller.abort();
  }, []);

  const closed = !applicationStatus.open;
  const steps = [
    {
      n: 1,
      title: a.step1Title,
      body: (<><p>{a.step1Intro}</p><ul className="doc-list">{a.docs.map((d) => (<li key={d}><FileIcon /> {d}</li>))}</ul></>),
    },
    {
      n: 2,
      title: a.step2Title,
      body: (<><p>{a.step2Intro}</p><ul className="doc-list"><li><MailIcon /> {a.step2Rule1}</li><li><FileIcon /> {a.step2Rule2}</li></ul></>),
    },
    { n: 3, title: a.step3Title, body: <p>{a.step3Body}</p> },
    { n: 4, title: a.step4Title, body: (<><p>{a.step4Body}</p><div className="warn-box">{a.step4Warn}</div></>) },
    { n: 5, title: a.step5Title, body: <p>{a.step5Body}</p> },
  ];

  const tracks = [
    { key: "public", title: a.formPublic, text: a.formPublicText },
    { key: "private", title: a.formPrivate, text: a.formPrivateText },
  ];

  return (
    <main className="page">
      <section className="page-hero">
        <div className="eyebrow">{a.eyebrow}</div>
        <h1>{a.titleA}<span className="shimmer">{a.titleB}</span></h1>
        <p className="page-sub">{a.sub}</p>
        <div className={`application-status ${closed ? "closed" : "open"}`} role="status">
          <strong>{closed ? "Applications are closed" : "Applications are open"}</strong>
          <span>{closed ? "Downloads and submissions are currently disabled. Please follow your regional KOICA office for the next application window." : applicationStatus.message}</span>
        </div>
      </section>

      <section className="section">
        <div className="timeline">
          {steps.map((s) => (<div key={s.n} className="tl-step"><div className="tl-marker"><span className="tl-num">{s.n}</span><span className="tl-line" /></div><div className="tl-card"><h3>{s.title}</h3>{s.body}</div></div>))}
        </div>
      </section>

      <section className="section alt">
        <h2 className="section-title">{a.formsTitle}</h2>
        <p className="section-sub">{a.formsSub}</p>
        <div className="dl-grid">
          {tracks.map((track) => (
            <article className={`dl-card${closed ? " is-disabled" : ""}`} key={track.key}>
              <div className="dl-icon"><FileIcon /></div>
              <div className="dl-copy"><h3>{track.title}</h3><p>{track.text}</p></div>
              <div className="application-actions">
                <ActionButton href={applicationStatus.forms[track.key]} disabled={closed || !applicationStatus.forms[track.key]}>
                  <DownloadIcon /> {a.download}
                </ActionButton>
                <ActionButton href={applicationStatus.submissions[track.key]} disabled={closed || !applicationStatus.submissions[track.key]} secondary>
                  Submit {track.key === "public" ? "Public Sector" : "Private Sector"} Application
                </ActionButton>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">{a.contactTitle}</h2>
        <div className="contact-grid">
          <div className="contact-card"><span className="contact-tag">{a.contact1Tag}</span><h3>{a.contact1Title}</h3><p>{a.contact1Text}{" "}<a href="mailto:koicaghanaaciat@gmail.com">koicaghanaaciat@gmail.com</a></p></div>
          <div className="contact-card"><span className="contact-tag">{a.contact2Tag}</span><h3>{a.contact2Title}</h3><p>{a.contact2Text}{" "}<a href="mailto:KOICAYLP@hallym.ac.kr">KOICAYLP@hallym.ac.kr</a></p></div>
        </div>
      </section>
    </main>
  );
}
