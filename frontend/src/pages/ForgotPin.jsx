import { useState } from "react";
import { Link } from "react-router-dom";
import BrandLogos from "../components/BrandLogos";
import LanguageSwitcher from "../components/LanguageSwitcher";
import PekoLoader from "../components/PekoLoader";
import { API } from "../auth/AuthContext";
import { useT } from "../i18n";

export default function ForgotPin() {
  const { t } = useT(); const l=t.pinReset;
  const [name,setName]=useState(""); const [country,setCountry]=useState(""); const [track,setTrack]=useState("");
  const [busy,setBusy]=useState(false); const [err,setErr]=useState(""); const [sent,setSent]=useState(false);
  const submit=async(e)=>{e.preventDefault();setErr("");setBusy(true);try{
    const r=await fetch(`${API}/api/forgot-pin`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,country,track})});
    const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.error||l.error); setSent(true);
  }catch(x){setErr(x.message)}finally{setBusy(false)}};
  return <main className="login-wrap"><div className="login-card">
    <div className="login-language"><LanguageSwitcher/></div><div className="login-brand"><BrandLogos className="login-logo-lockup"/></div>
    <h1>{l.title}</h1><p className="login-sub">{l.sub}</p>
    {sent ? <div className="reset-success"><strong>{l.sentTitle}</strong><p>{l.sent}</p></div> : <form className="login-form" onSubmit={submit}>
      <label className="field"><span>{l.name}</span><input value={name} onChange={e=>setName(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck="false" required/></label>
      <label className="field"><span>{l.country}</span><input value={country} onChange={e=>setCountry(e.target.value)} required/></label>
      <label className="field"><span>{l.track}</span><select value={track} onChange={e=>setTrack(e.target.value)} required><option value="">{l.selectTrack}</option><option value="public">{l.publicTrack}</option><option value="private">{l.privateTrack}</option></select></label>
      {err&&<div className="login-error" role="alert">{err}</div>}
      <button className="btn login-btn" disabled={busy}>{busy?<><PekoLoader compact/><span>{l.sending}</span></>:l.submit}</button>
    </form>}
    <Link className="login-back" to="/login">{l.back}</Link>
  </div></main>;
}
