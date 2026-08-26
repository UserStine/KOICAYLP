import { useEffect, useRef, useState } from "react";
import peko from "../assets/peko.png";
import { WaveIcon } from "./Icons";
import { useT } from "../i18n";
import { API, useAuth } from "../auth/AuthContext";
import PekoLoader from "./PekoLoader";

function consumeSseChunk(buffer, onEvent) {
  let working = buffer.replace(/\r\n/g, "\n");
  let boundary = working.indexOf("\n\n");

  while (boundary >= 0) {
    const block = working.slice(0, boundary);
    working = working.slice(boundary + 2);

    let event = "message";
    const dataLines = [];

    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    }

    if (dataLines.length) {
      const raw = dataLines.join("\n");
      onEvent(event, JSON.parse(raw));
    }

    boundary = working.indexOf("\n\n");
  }

  return working;
}


function cleanPekoText(value) {
  return String(value || "")
    .replace(/\[(?:S\d+(?:\s*,\s*S\d+)*|LIVE)\]/gi, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function ChatWidget({ open, setOpen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const bodyRef = useRef(null);
  const requestRef = useRef(null);
  const { t, lang } = useT();
  const { user } = useAuth();

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open, busy]);

  useEffect(() => {
    requestRef.current?.abort();
    setMessages([]);
    setConversationId(null);
  }, [lang]);

  useEffect(() => () => requestRef.current?.abort(), []);


  const refreshHistory = async () => {
    if (!user) return setConversations([]);
    try {
      const response = await fetch(`${API}/api/ai/conversations`, { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (response.ok) setConversations(Array.isArray(data.conversations) ? data.conversations : []);
    } catch {}
  };

  useEffect(() => {
    if (open && user) refreshHistory();
  }, [open, user]);

  const openConversation = async (id) => {
    if (!user || busy) return;
    try {
      const response = await fetch(`${API}/api/ai/conversations/${id}`, { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to load conversation.");
      setConversationId(id);
      setMessages((data.messages || []).map((item) => ({
        id: item.id,
        from: item.role === "assistant" ? "bot" : "user",
        text: item.content || "",
        sources: item.sources || [],
        streaming: false,
      })));
      setShowHistory(false);
    } catch {}
  };

  const newConversation = () => {
    requestRef.current?.abort();
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
  };

  const ask = async (q) => {
    const message = q.trim();
    if (!message || busy) return;

    const history = messages
      .slice(-6)
      .map((item) => ({ role: item.from === "bot" ? "assistant" : "user", content: item.text }));

    const botId = `bot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const controller = new AbortController();
    requestRef.current = controller;

    setMessages((current) => [
      ...current,
      { from: "user", text: message },
      { id: botId, from: "bot", text: "", sources: [], streaming: true },
    ]);
    setInput("");
    setBusy(true);

    const updateBot = (updater) => {
      setMessages((current) =>
        current.map((item) => (item.id === botId ? updater(item) : item))
      );
    };

    try {
      const response = await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message, language: lang, history, conversationId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || t.chat.error);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/event-stream") || !response.body) {
        const data = await response.json().catch(() => ({}));
        updateBot((item) => ({
          ...item,
          text: data.reply || t.chat.reply,
          sources: Array.isArray(data.sources) ? data.sources : [],
          streaming: false,
        }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamError = "";
      let receivedText = false;

      const onEvent = (event, data) => {
        if (event === "start") {
          if (data.conversationId) setConversationId(data.conversationId);
        } else if (event === "token") {
          if (data.text) receivedText = true;
          updateBot((item) => ({ ...item, text: `${item.text}${data.text || ""}` }));
        } else if (event === "done") {
          if (data.conversationId) setConversationId(data.conversationId);
          updateBot((item) => ({
            ...item,
            sources: Array.isArray(data.sources) ? data.sources : [],
            streaming: false,
          }));
        } else if (event === "error") {
          streamError = data.error || t.chat.error;
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer = consumeSseChunk(buffer + decoder.decode(value, { stream: true }), onEvent);
      }

      buffer = consumeSseChunk(buffer + decoder.decode(), onEvent);
      if (buffer.trim()) consumeSseChunk(`${buffer}\n\n`, onEvent);
      if (streamError) throw new Error(streamError);

      updateBot((item) => ({
        ...item,
        text: item.text || t.chat.reply,
        streaming: false,
      }));
    } catch (error) {
      if (error?.name === "AbortError") return;

      // If SSE itself is unavailable before any text arrives, retry the same
      // backwards-compatible endpoint as a normal JSON request.
      if (!receivedText && !streamError) {
        try {
          const fallback = await fetch(`${API}/api/ai/chat`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ message, language: lang, history, conversationId }),
            signal: controller.signal,
          });
          const data = await fallback.json().catch(() => ({}));
          if (!fallback.ok) throw new Error(data.error || t.chat.error);
          if (data.conversationId) setConversationId(data.conversationId);
          updateBot((item) => ({
            ...item,
            text: data.reply || t.chat.reply,
            sources: Array.isArray(data.sources) ? data.sources : [],
            error: false,
            streaming: false,
          }));
          return;
        } catch (fallbackError) {
          if (fallbackError?.name === "AbortError") return;
          error = fallbackError;
        }
      }

      updateBot((item) => ({
        ...item,
        text: item.text
          ? `${item.text}\n\n${error.message || t.chat.error}`
          : error.message || t.chat.error,
        error: true,
        streaming: false,
      }));
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      setBusy(false);
      if (user) refreshHistory();
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
            {user && (
              <>
                <button className="chat-head-action" type="button" title="Chat history" onClick={() => setShowHistory((value) => !value)}>History</button>
                <button className="chat-head-action" type="button" title="New chat" onClick={newConversation}>New</button>
              </>
            )}
            <button className="chat-close" aria-label={t.chat.close} onClick={() => setOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          {user && showHistory && (
            <div className="chat-history">
              <div className="chat-history-title">Previous conversations</div>
              {conversations.length === 0 ? (
                <div className="chat-history-empty">No saved conversations yet.</div>
              ) : conversations.map((conversation) => (
                <button key={conversation.id} type="button" className={conversation.id === conversationId ? "active" : ""} onClick={() => openConversation(conversation.id)}>
                  <span>{conversation.title}</span>
                  <small>{conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString() : ""}</small>
                </button>
              ))}
            </div>
          )}

          <div className="chat-body" ref={bodyRef}>
            <div className="chat-msg"><WaveIcon /> {t.chat.greeting}</div>

            <div className="chat-chips">
              {t.chat.chips.map((c) => (
                <button key={c} className="chat-chip" disabled={busy} onClick={() => ask(c)}>{c}</button>
              ))}
            </div>

            {messages.map((m, i) => (
              <div key={m.id || `${m.from}-${i}`} className={`chat-msg ${m.from === "user" ? "user" : ""} ${m.error ? "error" : ""}`}>
                <div className="chat-answer-text">
                  {m.from === "bot" ? cleanPekoText(m.text) : m.text}
                  {m.from === "bot" && m.streaming && m.text && (
                    <span className="chat-stream-cursor" aria-hidden="true">▍</span>
                  )}
                </div>
                {m.from === "bot" && m.sources?.length > 0 && (
                  <div className="chat-sources" aria-label={t.chat.sources}>
                    {m.sources.slice(0, 3).map((source) => (
                      <span key={`${source.ref}-${source.title}`} title={source.source || source.title}>
                        {source.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {busy && !messages.some((m) => m.from === "bot" && m.streaming && m.text) && (
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
