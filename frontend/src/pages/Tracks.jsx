import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Arrow, CheckIcon, GlobeIcon, LaptopIcon } from "../components/Icons";
import { useT } from "../i18n";

/* The two tracks are the whole page: an interactive split panel that
   expands on hover/tap, plus a stacked comparison table. */
const TRACK_ICONS = [<GlobeIcon />, <LaptopIcon />];
const TRACK_IDS = ["public", "private"];

export default function Tracks() {
  const [searchParams] = useSearchParams();
  const initialSector = searchParams.get("sector") === "private" ? "private" : "public";
  const [active, setActive] = useState(initialSector);
  const { t } = useT();
  const tr = t.tracks;

  return (
    <main className="page">
      <section className="page-hero">
        <div className="eyebrow">{tr.eyebrow}</div>
        <h1>{tr.titleA}<span className="shimmer">{tr.titleB}</span></h1>
        <p className="page-sub">{tr.sub}</p>
      </section>

      <section className="section split-section">
        <div className="split" data-active={active}>
          {tr.list.map((tk, i) => {
            const id = TRACK_IDS[i];
            return (
              <button
                key={id}
                className={`split-panel ${id}${active === id ? " is-active" : ""}`}
                onMouseEnter={() => setActive(id)}
                onFocus={() => setActive(id)}
                onClick={() => setActive(id)}
                aria-pressed={active === id}
              >
                <span className="split-badge">{tk.badge}</span>
                <span className="split-icon">{TRACK_ICONS[i]}</span>
                <h2 className="split-name">{tk.name}</h2>
                <span className="split-tagline">{tk.tagline}</span>

                <div className="split-detail">
                  <p className="split-blurb">{tk.blurb}</p>
                  <ul className="split-list">
                    {tk.objectives.map((o) => (
                      <li key={o}><CheckIcon /> {o}</li>
                    ))}
                  </ul>
                  <span className="split-places">{tk.places}</span>
                </div>

                <span className="split-hint">{tr.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section alt">
        <h2 className="section-title">{tr.compareTitle}</h2>
        <p className="section-sub">{tr.compareSub}</p>
        <div className="compare-table" role="table">
          <div className="ct-row ct-head" role="row">
            <div role="columnheader">{tr.colCategory}</div>
            <div role="columnheader"><span className="ct-dot pub" />{tr.colPublic}</div>
            <div role="columnheader"><span className="ct-dot priv" />{tr.colPrivate}</div>
          </div>
          {tr.rows.map((r) => (
            <div key={r.label} className="ct-row" role="row">
              <div className="ct-label" role="cell">{r.label}</div>
              <div role="cell" data-col={tr.colPublic}>{r.pub}</div>
              <div role="cell" data-col={tr.colPrivate}>{r.priv}</div>
            </div>
          ))}
        </div>
        <p className="table-note">{tr.note}</p>
      </section>

      <section className="section cta-row">
        <div className="cta-card">
          <div>
            <h3>{tr.ctaTitle}</h3>
            <p>{tr.ctaText}</p>
          </div>
          <div className="cta-actions">
            <Link className="btn" to="/eligibility"><span>{tr.ctaBtn}</span> <Arrow /></Link>
            <Link className="btn ghost" to="/apply"><span>{tr.ctaAlt}</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
