import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useT } from "../i18n";

export default function AdminPinResets(){
  const {api}=useAuth(); const {t}=useT(); const l=t.admin.pinResets;
  const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[err,setErr]=useState(""),[secret,setSecret]=useState(null),[filter,setFilter]=useState("pending");
  const load=async()=>{setLoading(true);setErr("");try{const d=await api("/api/admin/pin-resets");setRows(d.requests||[])}catch(e){setErr(e.message)}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const shown=useMemo(()=>filter==="all"?rows:rows.filter(r=>r.status===filter),[rows,filter]);
  const approve=async(r)=>{if(!confirm(l.confirmApprove.replace("{name}",r.participantName)))return;try{const d=await api(`/api/admin/pin-resets/${r.id}/approve`,{method:"POST",body:JSON.stringify({})});setSecret({name:d.participant?.name||r.participantName,pin:d.tempPin});await load()}catch(e){setErr(e.message)}};
  const reject=async(r)=>{if(!confirm(l.confirmReject.replace("{name}",r.participantName)))return;try{await api(`/api/admin/pin-resets/${r.id}/reject`,{method:"POST",body:JSON.stringify({})});await load()}catch(e){setErr(e.message)}};
  const copy=async()=>{if(secret?.pin) await navigator.clipboard.writeText(secret.pin)};
  return <div className="portal-page"><header className="portal-head"><div><p className="portal-eyebrow">{t.admin.badge}</p><h1>{l.title}</h1><p className="portal-sub">{l.sub}</p></div></header>
    {secret&&<div className="pin-secret-card"><strong>{l.tempTitle}</strong><p>{l.tempExplain.replace("{name}",secret.name)}</p><div className="pin-secret-value"><code>{secret.pin}</code><button className="btn btn-sm" onClick={copy}>{l.copy}</button></div><p>{l.tempWarning}</p><button className="btn btn-secondary btn-sm" onClick={()=>setSecret(null)}>{l.done}</button></div>}
    {err&&<div className="login-error">{err}</div>}
    <div className="admin-filter-row"><button className={`btn btn-sm${filter==="pending"?"":" btn-secondary"}`} onClick={()=>setFilter("pending")}>{l.pending}</button><button className={`btn btn-sm${filter==="all"?"":" btn-secondary"}`} onClick={()=>setFilter("all")}>{l.all}</button><button className="btn btn-secondary btn-sm" onClick={load}>{l.refresh}</button></div>
    {loading?<p>{l.loading}</p>:<div className="ppl-table pin-reset-table"><div className="ppl-row ppl-head"><span>{l.participant}</span><span>{l.details}</span><span>{l.requested}</span><span>{l.actions}</span></div>
      {shown.map(r=><div className="ppl-row" key={r.id}><span data-c={l.participant}><strong>{r.participantName}</strong><small className="pin-status">{r.status}</small></span><span data-c={l.details}>{r.country||"-"}<br/><small>{r.track==="private"?l.privateTrack:l.publicTrack}</small></span><span data-c={l.requested}>{r.requestedAt?new Date(r.requestedAt).toLocaleString():"-"}</span><span data-c={l.actions}>{r.status==="pending"?<div className="admin-row-actions"><button className="btn btn-sm" onClick={()=>approve(r)}>{l.approve}</button><button className="btn btn-secondary btn-sm" onClick={()=>reject(r)}>{l.reject}</button></div>:<span className="mini-badge">{r.status}</span>}</span></div>)}
      {!shown.length&&<p className="ppl-empty">{l.empty}</p>}</div>}
  </div>;
}
