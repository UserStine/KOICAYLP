import { useState, useEffect, useRef } from "react";
import peko from "../assets/peko.png";
import { WaveIcon } from "./Icons";
import { useT } from "../i18n";
import { API } from "../auth/AuthContext";

/* Controlled from App so any page can open the chat via openChat() */
export default function ChatWidget({ open, setOpen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);
  const { t, lang } = useT();

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

  /* Clear the transcript when language changes so replies stay consistent. */
  useEffect(() => {
    setMessages([]);
  }, [lang]);

  const ask = async (q) => {
    const message = q.trim();
    if (!message || sending) return;

    const history = messages
      .slice(-6)
      .map((item) => ({
        role: item.from === "bot" ? "assistant" : "user",
        content: item.text,
      }));

    setMessages((current) => [...current, { from: "user", text: message }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          language: lang,
          history,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "AI service is unavailable.");

      setMessages((current) => [
        ...current,
        {
          from: "bot",
          text: data.reply,
          sources: Array.isArray(data.sources) ? data.sources : [],
        },
      ]);
    } catch (error) {
      setMessages((current) => [...current, { from: "bot", text: error.message, sources: [] }]);
    } finally {
      setSending(false);
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
                <button key={c} className="chat-chip" disabled={sending} onClick={() => ask(c)}>{c}</button>
              ))}
            </div>

            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from === "user" ? "user" : ""}`}>
                <div>{m.text}</div>
                {m.from === "bot" && m.sources?.length > 0 && (
                  <div className="chat-sources" aria-label="Sources">
                    {m.sources.map((source) => (
                      <span className="chat-source" key={`${source.ref}-${source.title}`}>
                        {source.ref} · {source.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sending && <div className="chat-msg chat-thinking">Searching the KOICA knowledge base…</div>}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder={t.chat.placeholder}
              value={input}
              disabled={sending}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
            />
            <button aria-label={t.chat.send} disabled={sending || !input.trim()} onClick={() => ask(input)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>

          <div className="chat-note">Answers are grounded in the KOICA YLP knowledge base. Confirm cohort-specific decisions with KOICA.</div>
        </div>
      )}
    </>
  );
}
