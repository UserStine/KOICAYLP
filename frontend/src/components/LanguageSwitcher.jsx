import { useState, useRef, useEffect } from "react";
import { useT, LANG_ORDER, LANG_LABELS, LANGS } from "../i18n";

const GlobeSmall = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.6-4-9s1.3-6.4 4-9z" />
  </svg>
);

export default function LanguageSwitcher({ inline = false }) {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (inline) {
    return (
      <div className="lang-inline" role="group" aria-label={t.nav.language}>
        {LANG_ORDER.map((code) => (
          <button
            key={code}
            className={`lang-pill${code === lang ? " is-on" : ""}`}
            onClick={() => setLang(code)}
            aria-pressed={code === lang}
          >
            {LANG_LABELS[code]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="lang-wrap" ref={ref}>
      <button
        className="lang-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.nav.language}
      >
        <GlobeSmall />
        <span>{LANG_LABELS[lang]}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.6" strokeLinecap="round" className={`lang-chev${open ? " up" : ""}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox">
          {LANG_ORDER.map((code) => (
            <li key={code}>
              <button
                className={`lang-opt${code === lang ? " is-on" : ""}`}
                role="option"
                aria-selected={code === lang}
                onClick={() => { setLang(code); setOpen(false); }}
              >
                {LANGS[code].langName}
                {code === lang && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.6" strokeLinecap="round"><path d="M4 12.5l5 5L20 6.5" /></svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
