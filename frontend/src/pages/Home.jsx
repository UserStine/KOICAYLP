import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import pekoMascot from "../assets/peko-megaphone.png";
import flagGh from "../assets/flag-gh.png";
import flagNg from "../assets/flag-ng.png";
import flagSn from "../assets/flag-sn.png";
import flagCi from "../assets/flag-ci.png";
import flagCm from "../assets/flag-cm.png";
import flagKr from "../assets/flag-kr.png";
import fellows01 from "../assets/fellows-01.png";
import fellows02 from "../assets/fellows-02.png";
import fellows03 from "../assets/fellows-03.png";
import fellows04 from "../assets/fellows-04.png";
import fellows05 from "../assets/fellows-05.png";
import fellows06 from "../assets/fellows-06.png";
import {
  CalendarCheckIcon, NetworkIcon, BookIcon, ChatSparkIcon, Arrow,
} from "../components/Icons";
import { useT } from "../i18n";

const TYPE_SPEED = 35;
const TYPE_DELAY = 400;

const ORBITS = [
  {
    cls: "orbit-4",
    cspin: "cspin-l60",
    items: [
      { src: flagGh, angle: 30, r: 399, size: "", shape: "", glow: "glow-gold", delay: 1.8, alt: "Ghana" },
      { src: flagKr, angle: 0, r: 399, size: "lg", shape: "sq24", glow: "glow-blue", delay: 1.7, alt: "Republic of Korea" },
      { src: flagCi, angle: 95, r: 399, size: "lg", shape: "sq24", glow: "glow-orange", delay: 2.0, alt: "C\u00f4te d'Ivoire" },
      { src: flagSn, angle: 220, r: 399, size: "lg", shape: "sq24", glow: "glow-green", delay: 2.15, alt: "Senegal" },
      { src: flagCm, angle: 320, r: 399, size: "", shape: "", glow: "glow-red", delay: 2.3, alt: "Cameroon" },
      { src: flagNg, angle: 150, r: 399, size: "", shape: "", glow: "glow-green", delay: 2.45, alt: "Nigeria" },
    ],
  },
  {
    cls: "orbit-2",
    cspin: "cspin-r40",
    items: [
      { src: flagNg, angle: 60, r: 251, size: "", shape: "", glow: "glow-green", delay: 0.9, alt: "Nigeria" },
      { src: flagSn, angle: 180, r: 251, size: "md", shape: "", glow: "glow-gold", delay: 1.05, alt: "Senegal" },
      { src: flagCm, angle: 300, r: 251, size: "", shape: "sq", glow: "glow-gold", delay: 1.2, alt: "Cameroon" },
    ],
  },
  {
    cls: "orbit-1",
    cspin: "cspin-l30",
    items: [
      { src: flagGh, angle: 270, r: 177, size: "", shape: "sq", glow: "glow-red", delay: 0.6, alt: "Ghana" },
    ],
  },
];


const FELLOW_GALLERY = [
  { src: fellows01, alt: "KOICA Youth Leaders Program fellows during a group session" },
  { src: fellows02, alt: "KOICA Youth Leaders Program group photo with fellows and facilitators" },
  { src: fellows03, alt: "KOICA Youth Leaders Program representatives at the Accra programme" },
  { src: fellows04, alt: "KOICA Youth Leaders Program fellows with a programme facilitator" },
  { src: fellows05, alt: "KOICA Youth Leaders Program fellows sharing a moment together" },
  { src: fellows06, alt: "KOICA Youth Leaders Program fellows with the Ghana flag" },
];

const HUB_CARDS = [
  { key: "portal",     icon: <CalendarCheckIcon />, to: "/login" },
  { key: "network",    icon: <NetworkIcon />,       href: "https://koicakonnect.vercel.app/" },
  { key: "guide",      icon: <BookIcon />,          to: "/program" },
  { key: "assistant",  icon: <ChatSparkIcon />,     chat: true },
];

function useTypewriter(text, speed, delay) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    let interval;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length) {
          clearInterval(interval);
          setTimeout(() => setDone(true), 900);
        }
      }, speed);
    }, delay);
    return () => { clearTimeout(start); clearInterval(interval); };
  }, [text, speed, delay]);
  return { count, done };
}

function useCountUp(target, duration = 2000, delay = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    const timer = setTimeout(() => {
      const start = performance.now();
      const frame = (now) => {
        const t = Math.min((now - start) / duration, 1);
        setValue(Math.round((1 - Math.pow(1 - t, 3)) * target));
        if (t < 1) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return value;
}

function TypewriterHeading({ dark, light }) {
  const full = dark + light;
  const { count, done } = useTypewriter(full, TYPE_SPEED, TYPE_DELAY);
  return (
    <h1 key={full}>
      {full.slice(0, count).split("").map((ch, i) => (
        <span key={i} className={i < dark.length ? "dark" : "light"}>{ch}</span>
      ))}
      {!done && <span className="type-cursor" />}
    </h1>
  );
}

export default function Home({ openChat }) {
  const count = useCountUp(200);
  const { t } = useT();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div className="app">
        {/* ================= HERO ================= */}
        <section className="hero">
          <div className="hero-left">
            <div className="eyebrow">{t.home.eyebrow}</div>
            <div className="programme-cycle-badge">{t.home.programmeName}</div>
            <TypewriterHeading dark={t.home.headingDark} light={t.home.headingLight} />
            <div className="hero-cta">
              <div className="btn-border-wrap">
                <a className="btn btn-lg slide-right" href="#hub">
                  <span>{t.home.cta}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="cursor-tag">
              <svg width="26" height="26" viewBox="0 0 24 24">
                <path fill="#39BCF2" d="M4 2l16 7.6-7 2.1-3.4 6.5z" />
              </svg>
              <div className="cursor-name">{t.home.cursorName}</div>
            </div>
          </div>

          <div className="hero-right">
            <div className="orbit-stage">
              {ORBITS.map((orbit) => (
                <div key={orbit.cls} className={`orbit ${orbit.cls}`}>
                  {orbit.items.map((f, idx) => (
                    <div
                      key={idx}
                      className="orbit-item"
                      style={{
                        transform: `translate(-50%,-50%) rotate(${f.angle}deg) translate(${f.r}px) rotate(-${f.angle}deg)`,
                      }}
                    >
                      <div className={orbit.cspin}>
                        <img
                          className={`flag ${f.size} ${f.shape} ${f.glow}`}
                          style={{ animationDelay: `${f.delay}s` }}
                          src={f.src}
                          alt={f.alt}
                        />
                      </div>
                    </div>
                  ))}
                  {orbit.cls === "orbit-1" && (
                    <div className="orbit-center">
                      <div className="counter-wrap">
                        <div className="count-num">{count}+</div>
                        <div className="count-label">{t.home.countLabel}</div>
                        <div className="count-sub">{t.home.countSub}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* ================= TRACKS TEASER ================= */}
      <section className="tracks-teaser">
        <div className="tt-inner">
          <div className="tt-head" data-reveal>
            <h2 className="section-title">{t.home.tracksTeaser.titleA} <span>{t.home.tracksTeaser.titleB}</span></h2>
            <p className="section-sub">{t.home.tracksTeaser.sub}</p>
          </div>
          <div className="track-split">
            <Link className="ts-panel ts-public" to="/tracks?sector=public">
              <span className="ts-ghost">{t.home.tracksTeaser.publicGhost}</span>
              <span className="ts-kicker">{t.home.tracksTeaser.publicKicker}</span>
              <h2>{t.home.tracksTeaser.publicTitle}</h2>
              <p>{t.home.tracksTeaser.publicText}</p>
              <span className="ts-cta">{t.home.tracksTeaser.publicEnter} <Arrow /></span>
            </Link>
            <Link className="ts-panel ts-private" to="/tracks?sector=private">
              <span className="ts-ghost">{t.home.tracksTeaser.privateGhost}</span>
              <span className="ts-kicker">{t.home.tracksTeaser.privateKicker}</span>
              <h2>{t.home.tracksTeaser.privateTitle}</h2>
              <p>{t.home.tracksTeaser.privateText}</p>
              <span className="ts-cta">{t.home.tracksTeaser.privateEnter} <Arrow /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= PREVIOUS FELLOWS TESTIMONIALS ================= */}
      <section className="fellows-section">
        <div className="section-shell">
          <div className="section-heading" data-reveal>
            <span className="eyebrow">{t.home.testimonials.eyebrow}</span>
            <h2 className="section-title">{t.home.testimonials.titleA} <span>{t.home.testimonials.titleB}</span></h2>
            <p className="section-sub">{t.home.testimonials.sub}</p>
          </div>
          <div className="testimonial-grid">
            {t.home.testimonials.roles.map((label) => (
              <article className="testimonial-card" data-reveal key={label}>
                <span className="testimonial-quote">“</span>
                <p>{t.home.testimonials.comingSoon}</p>
                <div><strong>{label}</strong><span>{t.home.testimonials.program}</span></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PREVIOUS FELLOWS GALLERY ================= */}
      <section className="fellow-gallery-section">
        <div className="section-shell">
          <div className="section-heading" data-reveal>
            <span className="eyebrow">{t.home.gallery.eyebrow}</span>
            <h2 className="section-title">{t.home.gallery.titleA} <span>{t.home.gallery.titleB}</span></h2>
          </div>
          <div className="fellow-gallery">
            {FELLOW_GALLERY.map((photo, index) => (
              <figure className={`fellow-gallery-card fellow-gallery-card-${index + 1}`} data-reveal key={photo.src}>
                <img src={photo.src} alt={photo.alt} loading="lazy" />
              </figure>
            ))}
          </div>
          <div className="gallery-view-more" data-reveal>
            <a
              href="https://kshots-ten.vercel.app/koicalive"
              target="_blank"
              rel="noopener noreferrer"
              className="gallery-view-more-btn"
            >
              {t.home.gallery.viewMore || "View More Photos"}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </section>


      {/* ================= YLP HUB ================= */}
      <section className="hub" id="hub">
        <div className="hub-inner">
          <div className="hub-head" data-reveal>
            <div className="hub-head-text">
              <h2>
                {t.home.hubTitle1} <span className="shimmer">{t.home.hubTitle2}</span>
                <br />
                {t.home.hubTitle3}
              </h2>
              <p className="hub-sub">{t.home.hubSub}</p>
            </div>
            <div className="hub-peko">
              <img src={pekoMascot} alt="Peko" />
            </div>
          </div>
          <div className="hub-grid">
            {HUB_CARDS.map((card, i) => {
              const c = t.home.cards[card.key];
              const inner = (
                <>
                  <span className="hub-tag">{c.tag}</span>
                  <div className="hub-icon">{card.icon}</div>
                  <h3>{c.title}</h3>
                  <p>{c.text}</p>
                  <span className="hub-link">{c.link} <Arrow /></span>
                </>
              );
              const style = { animationDelay: `${0.1 * (i + 1)}s` };
              if (card.chat)
                return (
                  <a key={card.key} className="hub-card" data-reveal style={style} href="#"
                    onClick={(e) => { e.preventDefault(); openChat(); }}>
                    {inner}
                  </a>
                );
              if (card.to)
                return (
                  <Link key={card.key} className="hub-card" data-reveal style={style} to={card.to}>
                    {inner}
                  </Link>
                );
              return (
                <a key={card.key} className="hub-card" data-reveal style={style} href={card.href}
                  target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
