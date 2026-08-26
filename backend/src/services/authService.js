import crypto from "node:crypto";
import { authTokenTtlMs, secret, sessionTtlMs } from "../config/env.js";
import { readJson, writeJson } from "../repositories/jsonStore.js";

export function hashPin(pin, salt) { return crypto.scryptSync(String(pin).trim().toUpperCase(), salt, 32).toString("hex"); }
export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) { return { salt, hash: crypto.scryptSync(String(password), salt, 32).toString("hex") }; }
export function safeEqualHex(a, b) { try { const x=Buffer.from(String(a),"hex"), y=Buffer.from(String(b),"hex"); return x.length===y.length && crypto.timingSafeEqual(x,y); } catch { return false; } }
export function verifyParticipantCredential(input, participant) {
  if (!participant) return false;
  if (participant.passwordHash) return safeEqualHex(hashPassword(input, participant.passwordSalt).hash, participant.passwordHash);
  if (!participant.pinHash || !participant.salt) return false;
  return safeEqualHex(hashPin(input, participant.salt), participant.pinHash);
}
export function issueSessionToken(id, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ id, exp: now + sessionTtlMs })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url"); return `${body}.${sig}`;
}
export function readSessionToken(token, now = Date.now()) {
  if (!token || !token.includes(".")) return null; const [body,sig]=token.split(".");
  const expected=crypto.createHmac("sha256",secret).update(body).digest("base64url");
  if (sig.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return null;
  try { const data=JSON.parse(Buffer.from(body,"base64url").toString()); return data.exp>now?data:null; } catch { return null; }
}
export function createResetToken(kind, participantId) {
  const raw=crypto.randomBytes(32).toString("base64url"), digest=crypto.createHash("sha256").update(raw).digest("hex");
  const all=readJson("auth-tokens.json", []).filter((t)=>!t.usedAt && t.expiresAt>Date.now()); all.push({kind,participantId,digest,expiresAt:Date.now()+authTokenTtlMs,usedAt:null}); writeJson("auth-tokens.json",all); return raw;
}
export function consumeResetToken(kind, raw) {
  const digest=crypto.createHash("sha256").update(String(raw||"")).digest("hex"), all=readJson("auth-tokens.json",[]);
  const token=all.find((t)=>t.kind===kind&&!t.usedAt&&t.expiresAt>Date.now()&&safeEqualHex(t.digest,digest)); if(!token)return null; token.usedAt=Date.now(); writeJson("auth-tokens.json",all); return token;
}
