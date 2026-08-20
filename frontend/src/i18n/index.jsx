import { createContext, useContext, useState, useEffect } from "react";
import en from "./en";
import ko from "./ko";
import fr from "./fr";

export const LANGS = { en, ko, fr };
export const LANG_ORDER = ["en", "ko", "fr"];
export const LANG_LABELS = { en: "EN", ko: "한국어", fr: "FR" };

const STORAGE_KEY = "ylp-lang";
const LangContext = createContext({ lang: "en", t: en, setLang: () => {} });

function detectLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS[saved]) return saved;
  } catch {
    /* localStorage unavailable, fall through to browser detection */
  }
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("ko")) return "ko";
  if (nav.startsWith("fr")) return "fr";
  return "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);

  const setLang = (next) => {
    if (!LANGS[next]) return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore write failures (private mode, etc.) */
    }
  };

  /* keep the document language in sync for screen readers and search engines */
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t: LANGS[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

/* Usage:  const { t, lang, setLang } = useT();  then  t.nav.program  */
export function useT() {
  return useContext(LangContext);
}
