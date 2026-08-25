import { useEffect, useRef, useState } from "react";
import peko from "../assets/peko.png";
import { WaveIcon } from "./Icons";
import { useT } from "../i18n";
import { API } from "../auth/AuthContext";
import PekoLoader from "./PekoLoader";

export default function ChatWidget({ open, setOpen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);
  const { t, lang } = useT();

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open, busy]);

  useEffect(() => {
    setMessages([]);
  }, [lang]);

  const ask = async (q) => {
    const message = q.trim();
    if (!message || busy) return;

    const history = messages
      .slice(-6)
      .map((item) => ({ role: item.from === "bot" ? "assistant" : "user", content: item.text }));

    setMessages((current) => [...current, { from: "user", text: message }]);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, language: lang, history }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t.chat.error);

      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text: data.reply || t.chat.reply,
          sources: Array.isArray(data.sources) ? data.sources : [],
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { from: "bot", text: error.message || t.chat.error, error: true },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="chat-fab" aria-label={t.chat.open} onClick={() => setOpen((o) => !o)}>
        <span className="dot" />
        <img src={peko} alt="" />
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label={t.chat.title}>
          <div className="chat-head">
            <div className="chat-avatar"><img src={peko} alt="Peko" /></div>
            <div className="chat-head-text">
              <strong>{t.chat.title}</strong>
              <small>{t.chat.subtitle}</small>
            </div>
            <button className="chat-close" aria-label={t.chat.close} onClick={() => setOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          <div className="chat-body" ref={bodyRef}>
            <div className="chat-msg"><WaveIcon /> {t.chat.greeting}</div>

            <div className="chat-chips">
              {t.chat.chips.map((c) => (
                <button key={c} className="chat-chip" disabled={busy} onClick={() => ask(c)}>{c}</button>
              ))}
            </div>

            {messages.map((m, i) => (
              <div key={`${m.from}-${i}`} className={`chat-msg ${m.from === "user" ? "user" : ""} ${m.error ? "error" : ""}`}>
                <div className="chat-answer-text">{m.text}</div>
                {m.from === "bot" && m.sources?.length > 0 && (
                  <div className="chat-sources" aria-label={t.chat.sources}>
                    {m.sources.slice(0, 3).map((source) => (
                      <span key={`${source.ref}-${source.title}`} title={source.source || source.title}>
                        [{source.ref}] {source.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="chat-msg chat-thinking">
                <PekoLoader compact />
                <span>{t.chat.thinking}</span>
              </div>
            )}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder={t.chat.placeholder}
              value={input}
              maxLength={500}
              disabled={busy}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
            />
            <button aria-label={t.chat.send} disabled={!input.trim() || busy} onClick={() => ask(input)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>

          <div className="chat-note">{t.chat.note}</div>
        </div>
      )}
    </>
  );
}
