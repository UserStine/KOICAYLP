import { FileIcon, DownloadIcon, MailIcon } from "../components/Icons";
import { useT } from "../i18n";

export default function Apply() {
  const { t } = useT();
  const a = t.apply;

  const steps = [
    {
      n: 1,
      title: a.step1Title,
      body: (
        <>
          <p>{a.step1Intro}</p>
          <ul className="doc-list">
            {a.docs.map((d) => (<li key={d}><FileIcon /> {d}</li>))}
          </ul>
        </>
      ),
    },
    {
      n: 2,
      title: a.step2Title,
      body: (
        <>
          <p>{a.step2Intro}</p>
          <ul className="doc-list">
            <li><MailIcon /> {a.step2Rule1}</li>
            <li><FileIcon /> {a.step2Rule2}</li>
          </ul>
        </>
      ),
    },
    { n: 3, title: a.step3Title, body: <p>{a.step3Body}</p> },
    {
      n: 4,
      title: a.step4Title,
      body: (
        <>
          <p>{a.step4Body}</p>
          <div className="warn-box">{a.step4Warn}</div>
        </>
      ),
    },
    { n: 5, title: a.step5Title, body: <p>{a.step5Body}</p> },
  ];

  return (
    <main className="page">
      <section className="page-hero">
        <div className="eyebrow">{a.eyebrow}</div>
        <h1>{a.titleA}<span className="shimmer">{a.titleB}</span></h1>
        <p className="page-sub">{a.sub}</p>
      </section>

      <section className="section">
        <div className="timeline">
          {steps.map((s) => (
            <div key={s.n} className="tl-step">
              <div className="tl-marker">
                <span className="tl-num">{s.n}</span>
                <span className="tl-line" />
              </div>
              <div className="tl-card">
                <h3>{s.title}</h3>
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section alt">
        <h2 className="section-title">{a.formsTitle}</h2>
        <p className="section-sub">{a.formsSub}</p>
        <div className="dl-grid">
          {/* REPLACE href="#" with the real form links */}
          <a className="dl-card" href="#" target="_blank" rel="noopener noreferrer">
            <div className="dl-icon"><FileIcon /></div>
            <div>
              <h3>{a.formPublic}</h3>
              <p>{a.formPublicText}</p>
            </div>
            <span className="dl-btn"><DownloadIcon /> {a.download}</span>
          </a>
          <a className="dl-card" href="#" target="_blank" rel="noopener noreferrer">
            <div className="dl-icon"><FileIcon /></div>
            <div>
              <h3>{a.formPrivate}</h3>
              <p>{a.formPrivateText}</p>
            </div>
            <span className="dl-btn"><DownloadIcon /> {a.download}</span>
          </a>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">{a.contactTitle}</h2>
        <div className="contact-grid">
          <div className="contact-card">
            <span className="contact-tag">{a.contact1Tag}</span>
            <h3>{a.contact1Title}</h3>
            <p>
              {a.contact1Text}{" "}
              <a href="mailto:koicaghanaaciat@gmail.com">koicaghanaaciat@gmail.com</a>
            </p>
          </div>
          <div className="contact-card">
            <span className="contact-tag">{a.contact2Tag}</span>
            <h3>{a.contact2Title}</h3>
            <p>
              {a.contact2Text}{" "}
              <a href="mailto:KOICAYLP@hallym.ac.kr">KOICAYLP@hallym.ac.kr</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
