import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import BrandLogos from "../components/BrandLogos";
import PekoLoader from "../components/PekoLoader";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../i18n";

export default function ChangePin(){
  const {user,api,refreshUser}=useAuth(); const {t}=useT(); const l=t.pinReset; const nav=useNavigate();
  const [pin,setPin]=useState(""); const [confirmPin,setConfirmPin]=useState(""); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  if(!user) return <Navigate to="/login" replace/>;
  const submit=async(e)=>{e.preventDefault();setErr("");setBusy(true);try{await api("/api/auth/change-pin",{method:"POST",body:JSON.stringify({pin,confirmPin})});await refreshUser();nav("/portal",{replace:true});}catch(x){setErr(x.message)}finally{setBusy(false)}};
  return <main className="login-wrap"><div className="login-card"><div className="login-brand"><BrandLogos className="login-logo-lockup"/></div>
    <h1>{l.changeTitle}</h1>
    <form className="login-form" onSubmit={submit}>
      <label className="field"><span>{l.newPin}</span><input type="password" value={pin} onChange={e=>setPin(e.target.value.toUpperCase())} autoComplete="new-password" required/></label>
      <label className="field"><span>{l.confirmPin}</span><input type="password" value={confirmPin} onChange={e=>setConfirmPin(e.target.value.toUpperCase())} autoComplete="new-password" required/></label>
      {err&&<div className="login-error" role="alert">{err}</div>}
      <button className="btn login-btn" disabled={busy}>{busy?<><PekoLoader compact/><span>{l.saving}</span></>:l.save}</button>
    </form>
  </div></main>;
}
