import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import peko from "../assets/peko.png";
import koicaLogo from "../assets/koica-logo.png";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../i18n";

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
      const who = await login(name, pin);
      nav(who.role === "admin" ? "/admin" : "/portal");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <img className="login-logo" src={koicaLogo} alt="KOICA" />
          <span className="logo-divider" />
          <span className="logo-ylp">YLP</span>
        </div>

        <div className="login-peko"><img src={peko} alt="" /></div>

        <h1>{l.title}</h1>
        <p className="login-sub">{l.sub}</p>

        <form onSubmit={submit} className="login-form">
          <label className="field">
            <span>{l.name}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={l.namePlaceholder}
              autoComplete="name"
              required
            />
          </label>

          <label className="field">
            <span>{l.pin}</span>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              placeholder="KYLP000"
              autoComplete="off"
              spellCheck="false"
              className="pin-input"
              required
            />
          </label>

          {err && <div className="login-error" role="alert">{err}</div>}

          <button className="btn login-btn" disabled={busy}>
            <span>{busy ? l.working : l.submit}</span>
          </button>
        </form>

        <p className="login-help">{l.help}</p>
        <Link className="login-back" to="/">{l.back}</Link>
      </div>
    </main>
  );
}
