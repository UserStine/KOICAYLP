import { useEffect, useRef, useState } from "react";
import peko from "../assets/peko.png";
import { WaveIcon } from "./Icons";
import { useT } from "../i18n";
import { API } from "../auth/AuthContext";
import PekoLoader from "./PekoLoader";

function formatInline(str) {
  if (!str) return "";
  const escaped = String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(S\d+|LIVE)\]/g, '<span class="chat-source-tag">[$1]</span>');
}

function FormattedMessage({ text }) {
  if (!text) return null;
  const blocks = text.split(/\n\n+/);

  return (
    <div className="chat-formatted-body">
      {blocks.map((block, bIdx) => {
        const lines = block.split("\n").filter((l) => l.trim().length > 0);
        const isList = lines.length > 0 && lines.every((line) => /^\s*[-*•]\s+/.test(line.trim()));

        if (isList) {
          return (
            <ul key={bIdx} className="chat-msg-list">
              {lines.map((line, lIdx) => {
                const itemText = line.trim().replace(/^[-*•]\s+/, "");
                return <li key={lIdx} dangerouslySetInnerHTML={{ __html: formatInline(itemText) }} />;
              })}
            </ul>
          );
        }

        return (
          <p key={bIdx} className="chat-msg-p" dangerouslySetInnerHTML={{ __html: formatInline(lines.join("<br />")) }} />
        );
      })}
    </div>
  );
}

export default function ChatWidget({ open, setOpen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);
  const { t, lang } = useT();

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open, busy]);

  useEffect(() => {
    setMessages([]);
  }, [lang]);

  const ask = async (q) => {
    const message = q.trim();
    if (!message || busy) return;

    const history = messages
      .slice(-6)
      .map((item) => ({ role: item.from === "bot" ? "assistant" : "user", content: item.text }))
      .filter((item) => item.content);

    setMessages((current) => [...current, { from: "user", text: message }]);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/json",
        },
        body: JSON.stringify({ message, language: lang, history, stream: true }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream") && response.body) {
        // SSE Stream reading
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamedText = "";
        let streamedSources = [];

        // Insert initial empty bot message
        setMessages((current) => [...current, { from: "bot", text: "", sources: [] }]);

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const evt of events) {
            const lines = evt.split("\n");
            let eventType = "message";
            let dataStr = "";

            for (const line of lines) {
              if (line.startsWith("event:")) eventType = line.slice(6).trim();
              if (line.startsWith("data:")) dataStr = line.slice(5).trim();
            }

            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (eventType === "meta") {
                streamedSources = Array.isArray(parsed.sources) ? parsed.sources : [];
                setMessages((curr) => {
                  const next = [...curr];
                  const lastIdx = next.length - 1;
                  if (lastIdx >= 0 && next[lastIdx].from === "bot") {
                    next[lastIdx] = { ...next[lastIdx], sources: streamedSources };
                  }
                  return next;
                });
              } else if (eventType === "delta") {
                if (parsed.text) {
                  streamedText += parsed.text;
                  setMessages((curr) => {
                    const next = [...curr];
                    const lastIdx = next.length - 1;
                    if (lastIdx >= 0 && next[lastIdx].from === "bot") {
                      next[lastIdx] = { ...next[lastIdx], text: streamedText, sources: streamedSources };
                    }
                    return next;
                  });
                }
              } else if (eventType === "error") {
                throw new Error(parsed.error || t.chat.error);
              }
            } catch (err) {
              if (eventType === "error") throw err;
            }
          }
        }
      } else {
        // Non-streaming JSON fallback
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
      }
    } catch (error) {
      setMessages((current) => {
        const last = current[current.length - 1];
        if (last && last.from === "bot" && !last.text) {
          const updated = [...current];
          updated[updated.length - 1] = { from: "bot", text: error.message || t.chat.error, error: true };
          return updated;
        }
        return [...current, { from: "bot", text: error.message || t.chat.error, error: true }];
      });
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
                <div className="chat-answer-text">
                  {m.from === "user" ? m.text : <FormattedMessage text={m.text} />}
                </div>
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
