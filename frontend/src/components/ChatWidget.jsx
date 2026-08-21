import { useEffect, useRef, useState } from "react";
import peko from "../assets/peko.png";
import { WaveIcon } from "./Icons";
import { useT } from "../i18n";

const FAQ = [
  {
    terms: ["eligible", "eligibility", "who can apply", "requirements", "qualify"],
    answer: "Eligibility depends on the current KOICA YLP call. Check the Eligibility page for the listed age, professional, nationality, education and track requirements before applying.",
  },
  {
    terms: ["apply", "application", "how do i apply", "submit", "form"],
    answer: "Open the Apply page, choose the Public Sector or Private Sector track, download the required form and follow the submission instructions shown there. When applications are closed, the download and submission controls are disabled.",
  },
  {
    terms: ["public sector", "public track", "government"],
    answer: "The Public Sector track is intended for eligible applicants working in government or qualifying public institutions. Use the Public Sector application option on the Apply page.",
  },
  {
    terms: ["private sector", "private track", "company", "business"],
    answer: "The Private Sector track is intended for eligible applicants from qualifying private-sector organisations. Use the Private Sector application option on the Apply page.",
  },
  {
    terms: ["deadline", "close", "closing", "applications closed", "open"],
    answer: "The Apply page shows the current application status. If applications are closed, the site displays that status and disables the application buttons.",
  },
  {
    terms: ["calendar", "schedule", "programme", "program", "day", "session"],
    answer: "Use the programme calendar in the participant portal to view the activities scheduled for each day of the programme.",
  },
  {
    terms: ["login", "sign in", "pin", "portal"],
    answer: "Use the exact participant name and KOICA PIN issued for your account. If the details are correct but sign-in still fails, contact the programme administrator so the roster entry can be checked.",
  },
  {
    terms: ["contact", "email", "help", "support"],
    answer: "For application support, use the contact details shown on the Apply page. Programme-specific decisions should be confirmed directly with KOICA or the partner university.",
  },
];

function answerQuestion(question) {
  const normalized = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const match = FAQ.find((item) => item.terms.some((term) => normalized.includes(term)));
  return match?.answer || "I can help with eligibility, applications, Public Sector and Private Sector tracks, deadlines, the programme calendar, login and contact information. Try one of those topics.";
}

export default function ChatWidget({ open, setOpen }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bodyRef = useRef(null);
  const { t, lang } = useT();

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    setMessages([]);
  }, [lang]);

  const ask = (q) => {
    const message = q.trim();
    if (!message) return;

    setMessages((current) => [
      ...current,
      { from: "user", text: message },
      { from: "bot", text: answerQuestion(message) },
    ]);
    setInput("");
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
                <button key={c} className="chat-chip" onClick={() => ask(c)}>{c}</button>
              ))}
            </div>

            {messages.map((m, i) => (
              <div key={`${m.from}-${i}`} className={`chat-msg ${m.from === "user" ? "user" : ""}`}>
                <div>{m.text}</div>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder={t.chat.placeholder}
              value={input}
              maxLength={500}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask(input)}
            />
            <button aria-label={t.chat.send} disabled={!input.trim()} onClick={() => ask(input)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>

          <div className="chat-note">Quick programme guidance. Confirm official application decisions with KOICA.</div>
        </div>
      )}
    </>
  );
}
