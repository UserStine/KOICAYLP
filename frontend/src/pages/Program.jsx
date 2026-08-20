import { Link } from "react-router-dom";
import pekoMegaphone from "../assets/peko-megaphone.png";
import {
  LaptopIcon, GlobeIcon, PlaneIcon, SproutIcon, NetworkIcon, HeartHandIcon,
  ChatSparkIcon, Arrow,
} from "../components/Icons";
import { useT } from "../i18n";

const PHASE_ICONS = [<LaptopIcon />, <GlobeIcon />, <PlaneIcon />];
const AFTER_ICONS = [<SproutIcon />, <LaptopIcon />, <NetworkIcon />, <HeartHandIcon />];
const AFTER_TINTS = ["tint-green", "tint-blue", "tint-purple", "tint-orange"];

export default function Program({ openChat }) {
  const { t } = useT();
  const p = t.program;

  return (
    <main className="page">
      <section className="page-hero">
        <div className="eyebrow">{p.eyebrow}</div>
        <h1>{p.titleA}<span className="shimmer">{p.titleB}</span>{p.titleC}</h1>
        <p className="page-sub">{p.sub}</p>
      </section>

      <section className="stats-band">
        <div className="stat"><strong>5</strong><span>{p.stats.countries}</span></div>
        <div className="stat"><strong>2</strong><span>{p.stats.tracks}</span></div>
        <div className="stat"><strong>3</strong><span>{p.stats.phases}</span></div>
        <div className="stat"><strong>200</strong><span>{p.stats.leaders}</span></div>
      </section>

      <section className="section">
        <h2 className="section-title">{p.journeyTitleA}<span>{p.journeyTitleB}</span></h2>
        <p className="section-sub">{p.journeySub}</p>
        <div className="roadmap">
          {p.phases.map((ph, i) => (
            <div key={ph.title} className="phase-card">
              <div className="phase-top">
                <span className="phase-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="phase-icon">{PHASE_ICONS[i]}</span>
              </div>
              <h3>{ph.title}</h3>
              <p>{ph.body}</p>
              <span className="phase-tag">{ph.tag}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section alt">
        <div className="after-head">
          <div>
            <h2 className="section-title">{p.afterTitleA}<span>{p.afterTitleB}</span></h2>
            <p className="section-sub">{p.afterSub}</p>
          </div>
          <img className="after-peko" src={pekoMegaphone} alt="Peko" />
        </div>
        <div className="after-grid">
          {p.after.map((a, i) => (
            <div key={a.title} className={`after-card ${AFTER_TINTS[i]}`}>
              <div className="after-icon">{AFTER_ICONS[i]}</div>
              <h3>{a.title}</h3>
              <p>{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section cta-row">
        <div className="cta-card">
          <div>
            <h3>{p.ctaTitle}</h3>
            <p>{p.ctaText}</p>
          </div>
          <div className="cta-actions">
            <Link className="btn" to="/eligibility"><span>{p.ctaBtn}</span> <Arrow /></Link>
            <button className="btn ghost" onClick={openChat}>
              <ChatSparkIcon /> <span>{p.ctaAsk}</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
