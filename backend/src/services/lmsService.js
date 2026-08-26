import { programYear } from "../config/env.js";
export function calculateProgress(modules, progress) {
  const keys=(modules||[]).flatMap((m)=>(m.lessons||[]).map((l)=>`${m.id}:${l.id}`)); const completed=keys.filter((k)=>progress?.lessons?.[k]).length;
  return { completed, total: keys.length, percent: keys.length ? Math.round(completed/keys.length*100) : 0 };
}
export function compileCalendar(modules, track) {
  const months={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
  return (modules||[]).filter((m)=>!m.track||m.track===track).map((m)=>{ const x=String(m.title||"").match(/Day\s+(\d+)\s*·\s*([A-Za-z]+),\s*(\d+)\s+([A-Za-z]+)/i); if(!x)return null; const month=months[x[4].toLowerCase()]; if(month===undefined)return null; return { moduleId:m.id,dayNumber:Number(x[1]),date:new Date(Date.UTC(programYear,month,Number(x[3]))).toISOString().slice(0,10),label:m.title,events:(m.lessons||[]).map((l)=>({id:l.id,title:l.title,time:l.time||"",type:l.type||"event",facilitator:l.facilitator||""}))}; }).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date));
}
