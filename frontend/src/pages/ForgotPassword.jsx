import { useState } from "react";
import { Link } from "react-router-dom";
import peko from "../assets/peko.png";
import BrandLogos from "../components/BrandLogos";
import LanguageSwitcher from "../components/LanguageSwitcher";
import PekoLoader from "../components/PekoLoader";
import { API } from "../auth/AuthContext";
import { useT } from "../i18n";

export default function ForgotPassword() {
  const { t } = useT();
  const l = t.passwordReset;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [devLink, setDevLink] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(""); setMessage(""); setDevLink("");
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || l.error);
      setMessage(l.sent);
      if (data.devResetUrl) setDevLink(data.devResetUrl);
    } catch (error) {
      setErr(error.message || l.error);
    } finally { setBusy(false); }
  };

  return <main className="login-wrap">
    <div className="login-card password-card">
      <div className="login-language"><LanguageSwitcher /></div>
      <div className="login-brand"><BrandLogos className="login-logo-lockup" /></div>
      <div className="login-peko"><img src={peko} alt="" /></div>
      <h1>{l.forgotTitle}</h1>
      <p className="login-sub">{l.forgotSub}</p>
      <form onSubmit={submit} className="login-form">
        <label className="field">
          <span>{l.email}</span>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder={l.emailPlaceholder} autoComplete="email" required />
        </label>
        {err && <div className="login-error" role="alert">{err}</div>}
        {message && <div className="login-success" role="status">{message}</div>}
        {devLink && <a className="reset-dev-link" href={devLink}>{l.devLink}</a>}
        <button className="btn login-btn" disabled={busy}>{busy ? <><PekoLoader compact /><span>{l.sending}</span></> : l.send}</button>
      </form>
      <Link className="login-back" to="/login">{l.backLogin}</Link>
    </div>
  </main>;
}
