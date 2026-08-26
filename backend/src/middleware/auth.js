import { sessionCookie, sessionCookieOptions } from "../config/security.js";
import { getParticipantById } from "../repositories/participantRepository.js";
import { readSessionToken } from "../services/authService.js";

function parseCookies(header = "") {
  return Object.fromEntries(String(header).split(";").map((part)=>part.trim()).filter(Boolean).map((part)=>{ const i=part.indexOf("="); return i<0?[part,""]:[decodeURIComponent(part.slice(0,i)),decodeURIComponent(part.slice(i+1))]; }));
}

export async function auth(req, res, next) {
  try {
    const token=parseCookies(req.headers.cookie || "")[sessionCookie] || ""; const data=readSessionToken(token);
    if (!data) return res.status(401).json({ error: "Session expired. Please log in again." });
    const participant=await getParticipantById(data.id); if(!participant)return res.status(401).json({ error: "Account not found." });
    req.user=participant; next();
  } catch (error) {
    console.error(`[auth] participant_lookup_failed ip=${req.ip} message=${String(error?.message||error).slice(0,300)}`);
    res.status(503).json({ error: "Authentication service is temporarily unavailable." });
  }
}
export function adminOnly(req,res,next){ return (req.user?.role||"participant") === "admin" ? next() : res.status(403).json({error:"Admin access only."}); }
export function trackAllowed(req,res,next){ const track=req.params.track||req.body?.track; return !track||!req.user?.track||track===req.user.track||req.user.role==="admin"?next():res.status(403).json({error:"That resource belongs to the other track."}); }
export function clearSession(res){ res.clearCookie(sessionCookie, sessionCookieOptions); }
