import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import pekoMegaphone from "../assets/peko-megaphone.png";
import flagGh from "../assets/flag-gh.png";
import flagNg from "../assets/flag-ng.png";
import flagSn from "../assets/flag-sn.png";
import flagCi from "../assets/flag-ci.png";
import flagCm from "../assets/flag-cm.png";
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


/* REPLACE href values with your colleagues' real product URLs.
   Copy (title/text/tag/link) comes from src/i18n/*.js under home.cards */
const HUB_CARDS = [
  { key: "attendance", icon: <CalendarCheckIcon />, href: "https://koica-attendance.vercel.app/" },
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
            <h2 className="section-title">Two tracks, <span>one mission</span></h2>
            <p className="section-sub">
              Whether you shape policy or build products, there is a track for you. Both complete
              the same three-phase journey: online training, local training in Ghana, and
              invitational training in Korea.
            </p>
          </div>
          <div className="track-split">
            <Link className="ts-panel ts-public" to="/tracks">
              <span className="ts-ghost">PUBLIC</span>
              <span className="ts-kicker">Public Sector Track</span>
              <h2>For those shaping policy</h2>
              <p>
                Government officials, policy practitioners, and public sector employees driving
                AI-powered digital government innovation.
              </p>
              <span className="ts-cta">Explore the track <Arrow /></span>
            </Link>
            <Link className="ts-panel ts-private" to="/tracks">
              <span className="ts-ghost">PRIVATE</span>
              <span className="ts-kicker">Private Sector Track</span>
              <h2>For those building solutions</h2>
              <p>
                Entrepreneurs, developers, startup founders, and academic professionals turning
                ideas into MVPs and no-code AI applications.
              </p>
              <span className="ts-cta">Explore the track <Arrow /></span>
            </Link>
          </div>
        </div>
      </section>

<<<<<<< HEAD
=======
      {/* ================= PREVIOUS FELLOWS ================= */}
      <section className="fellows-section">
        <div className="section-shell">
          <div className="section-heading" data-reveal>
            <span className="eyebrow">Fellow stories</span>
            <h2 className="section-title">Hear from previous <span>fellows</span></h2>
            <p className="section-sub">Verified fellow testimonials can be published here without changing the page layout.</p>
          </div>
          <div className="testimonial-grid">
            {["Public Sector Fellow", "Private Sector Fellow", "Regional Fellow"].map((label) => (
              <article className="testimonial-card" data-reveal key={label}>
                <span className="testimonial-quote">“</span>
                <p>Verified testimonial coming soon.</p>
                <div><strong>{label}</strong><span>KOICA Youth Leaders Program</span></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fellow-gallery-section">
        <div className="section-shell">
          <div className="section-heading" data-reveal>
            <span className="eyebrow">Previous fellows</span>
            <h2 className="section-title">Moments from the <span>community</span></h2>
            <p className="section-sub">Add approved photos of previous fellows to these gallery slots.</p>
          </div>
          <div className="fellow-gallery">
            {[1, 2, 3, 4, 5, 6].map((number) => (
              <div className="fellow-gallery-card" data-reveal key={number}>
                <div className="fellow-photo-placeholder" aria-label={`Previous fellow gallery photo ${number}`}>
                  <span>Fellow photo</span><small>{String(number).padStart(2, "0")}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

>>>>>>> master
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
              <img src={pekoMegaphone} alt="Peko with a megaphone" />
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
