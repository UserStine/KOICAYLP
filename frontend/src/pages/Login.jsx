import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import peko from "../assets/peko.png";
import BrandLogos from "../components/BrandLogos";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../i18n";
import PekoLoader from "../components/PekoLoader";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Login() {
  const { login, user } = useAuth();
  const { t } = useT();
  const l = t.login;
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/portal"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const who = await login(name.replace(/\s+/g, " ").trim(), pin.trim());
      nav(who.role === "admin" ? "/admin" : (who.mustChangePin ? "/change-pin" : "/portal"));
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="login-language"><LanguageSwitcher /></div>
        <div className="login-brand">
          <BrandLogos className="login-logo-lockup" />
        </div>

        <div className="login-peko"><img src={peko} alt="" /></div>

        <h1>{l.title}</h1>
        <form onSubmit={submit} className="login-form">
          <label className="field">
            <span>{l.name}</span>
            {/* Mobile keyboards autocapitalise and autocorrect text inputs by
                default, which silently rewrites roster names and breaks the
                exact-match lookup on the server. All three must be off. */}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={l.namePlaceholder}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              required
            />
          </label>

          <label className="field">
            <span>{l.pin}</span>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              placeholder={l.pinPlaceholder || "KYLP000"}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
              inputMode="text"
              className="pin-input"
              required
            />
          </label>

          {err && <div className="login-error" role="alert">{err}</div>}

          <button className="btn login-btn" disabled={busy}>
            {busy ? <><PekoLoader compact /> <span>{l.working}</span></> : <span>{l.submit}</span>}
          </button>
        </form>

        <Link className="forgot-password-link" to="/forgot-pin">{l.forgot}</Link>
        <Link className="login-back" to="/">{l.back}</Link>
      </div>
    </main>
  );
}