import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import peko from "../assets/peko.png";
import BrandLogos from "../components/BrandLogos";
import LanguageSwitcher from "../components/LanguageSwitcher";
import PekoLoader from "../components/PekoLoader";
import { API } from "../auth/AuthContext";
import { useT } from "../i18n";

export default function ResetPassword() {
  const { t } = useT();
  const l = t.passwordReset;
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (password !== confirm) { setErr(l.mismatch); return; }
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword: confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || l.error);
      setDone(true);
      setTimeout(() => nav("/login", { replace: true }), 1800);
    } catch (error) { setErr(error.message || l.error); }
    finally { setBusy(false); }
  };

  return <main className="login-wrap">
    <div className="login-card password-card">
      <div className="login-language"><LanguageSwitcher /></div>
      <div className="login-brand"><BrandLogos className="login-logo-lockup" /></div>
      <div className="login-peko"><img src={peko} alt="" /></div>
      <h1>{l.resetTitle}</h1>
      <p className="login-sub">{token ? l.resetSub : l.invalidLink}</p>
      {done ? <div className="login-success" role="status">{l.success}</div> : token ? <form onSubmit={submit} className="login-form">
        <label className="field"><span>{l.newPassword}</span><input type="password" minLength="12" maxLength="128" value={password} onChange={(e)=>setPassword(e.target.value)} autoComplete="new-password" required /></label>
        <label className="field"><span>{l.confirmPassword}</span><input type="password" minLength="12" maxLength="128" value={confirm} onChange={(e)=>setConfirm(e.target.value)} autoComplete="new-password" required /></label>
        <p className="password-hint">{l.passwordHint}</p>
        {err && <div className="login-error" role="alert">{err}</div>}
        <button className="btn login-btn" disabled={busy}>{busy ? <><PekoLoader compact /><span>{l.updating}</span></> : l.update}</button>
      </form> : null}
      <Link className="login-back" to="/login">{l.backLogin}</Link>
    </div>
  </main>;
}
