import crypto from "node:crypto";
import { Router } from "express";
import { sessionCookie, sessionCookieOptions } from "../config/security.js";
import { sessionTtlMs } from "../config/env.js";
import { auth, clearSession } from "../middleware/auth.js";
import { authLimiter, signupLimiter } from "../middleware/rateLimit.js";
import { getParticipantByName, updateParticipant } from "../repositories/participantRepository.js";
import { createPinResetRequest } from "../repositories/pinResetRepository.js";
import { hashPin, issueSessionToken, verifyParticipantCredential } from "../services/authService.js";

const router = Router();
const publicUser = (p) => ({ id:p.id, name:p.name, country:p.country, track:p.track, cohort:p.cohort, role:p.role||"participant", mustChangePin:Boolean(p.mustChangePin) });

router.post("/login", authLimiter, async (req,res,next) => {
  try {
    const name=String(req.body?.name||"").trim(), pin=String(req.body?.pin||"").trim();
    if(!name||!pin) return res.status(400).json({error:"Enter both your name and your KOICA PIN."});
    const match=await getParticipantByName(name);
    if(!verifyParticipantCredential(pin,match)) return res.status(401).json({error:"We couldn't match that name and KOICA PIN. Check both and try again."});
    const token=issueSessionToken(match.id);
    res.cookie(sessionCookie,token,{...sessionCookieOptions,maxAge:sessionTtlMs});
    res.json({user:publicUser(match)});
  } catch(e) { next(e); }
});

router.post("/logout",auth,(req,res)=>{clearSession(res);res.json({ok:true});});
router.get("/me",auth,(req,res)=>res.json({user:publicUser(req.user)}));



router.post(["/forgot-pin", "/auth/forgot-pin"], signupLimiter, async (req,res,next) => {
  try {
    const name = String(req.body?.name || "").replace(/\s+/g, " ").trim();
    const country = String(req.body?.country || "").trim().toLowerCase();
    const track = String(req.body?.track || "").trim().toLowerCase();
    if (!name || !country || !["public","private"].includes(track)) {
      return res.status(400).json({ error: "Enter your full name, country, and programme track." });
    }
    const participant = await getParticipantByName(name);
    const matches = participant && participant.role !== "admin"
      && String(participant.country || "").trim().toLowerCase() === country
      && String(participant.track || "").trim().toLowerCase() === track;
    if (matches) await createPinResetRequest(participant);
    res.status(202).json({ ok:true, message:"If the details match the participant roster, your PIN reset request has been sent to the programme administrator." });
  } catch(e) { next(e); }
});

router.post("/auth/change-pin", auth, async (req,res,next) => {
  try {
    if (req.user?.role === "admin") return res.status(403).json({ error:"Participant PIN change only." });
    const pin = String(req.body?.pin || "").trim().toUpperCase();
    const confirmPin = String(req.body?.confirmPin || "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{6,24}$/.test(pin)) return res.status(400).json({ error:"PIN must be 6–24 letters, numbers, or hyphens." });
    if (pin !== confirmPin) return res.status(400).json({ error:"PINs do not match." });
    const salt = crypto.randomBytes(16).toString("hex");
    const pinHash = hashPin(pin, salt);
    await updateParticipant(req.user.id, { salt, pinHash, passwordSalt:"", passwordHash:"", mustChangePin:false });
    res.json({ ok:true });
  } catch(e) { next(e); }
});

export default router;
