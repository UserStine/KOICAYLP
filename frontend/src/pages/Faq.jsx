import { useState } from "react";
import { Link } from "react-router-dom";
import { ChatSparkIcon, Arrow } from "../components/Icons";
import { useT } from "../i18n";

export default function Faq({ openChat }) {
  const [openIdx, setOpenIdx] = useState(0);
  const { t } = useT();
  const f = t.faq;

  return (
    <main className="page">
      <section className="page-hero">
        <div className="eyebrow">{f.eyebrow}</div>
        <h1>{f.titleA}<span className="shimmer">{f.titleB}</span></h1>
        <p className="page-sub">{f.sub}</p>
      </section>

      <section className="section">
        <div className="accordion">
          {f.items.map((item, i) => {
            const open = openIdx === i;
            return (
              <div key={item.q} className={`acc-item${open ? " open" : ""}`}>
                <button className="acc-q" aria-expanded={open}
                  onClick={() => setOpenIdx(open ? -1 : i)}>
                  <span>{item.q}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.2" strokeLinecap="round" className="acc-chev">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {open && <div className="acc-a"><p>{item.a}</p></div>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="section cta-row">
        <div className="cta-card">
          <div>
            <h3>{f.ctaTitle}</h3>
            <p>{f.ctaText}</p>
          </div>
          <div className="cta-actions">
            <button className="btn" onClick={openChat}>
              <ChatSparkIcon /> <span>{f.ctaAsk}</span>
            </button>
            <Link className="btn ghost" to="/apply"><span>{f.ctaAlt}</span> <Arrow /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
