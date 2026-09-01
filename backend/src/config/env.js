import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Load backend/.env only as a local-development fallback.
// Platform environment variables (Vercel, Render, Railway, etc.) MUST win.
// Never overwrite a variable that the hosting platform already supplied.
try {
  const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env");
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
} catch { /* .env not present – expected in production */ }


export const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const isVercel = Boolean(process.env.VERCEL);
export const isProduction = process.env.NODE_ENV === "production";
export const runtimeRoot = isVercel ? path.join("/tmp", "koica-ylp") : backendDir;
export const dataDir = path.join(runtimeRoot, "data");
export const seedDataDir = path.join(backendDir, "data");
export const resourceDir = path.join(runtimeRoot, "uploads", "resources");
export const presentationDir = path.join(runtimeRoot, "uploads", "module-presentations");
export const port = Number(process.env.PORT || 4000);

for (const dir of [dataDir, resourceDir, presentationDir]) fs.mkdirSync(dir, { recursive: true });

export const secret = process.env.YLP_SECRET || (!isProduction ? crypto.randomBytes(32).toString("hex") : "");
if (!secret) throw new Error("YLP_SECRET is required in production.");
if (!process.env.YLP_SECRET) {
  process.env.YLP_SECRET = secret;
  console.warn("[security] No YLP_SECRET set; development sessions will reset on restart.");
}

export const sessionCookie = isProduction ? "__Host-ylp_session" : "ylp_session";
export const sessionTtlMs = Number(process.env.SESSION_TTL_MINUTES || 480) * 60_000;
export const authTokenTtlMs = Number(process.env.AUTH_TOKEN_TTL_MINUTES || 15) * 60_000;
export const programYear = Number(process.env.PROGRAM_YEAR || 2026);
export const maxResourceBytes = 50 * 1024 * 1024;
export const allowedResourceExtensions = new Set([".pdf",".doc",".docx",".ppt",".pptx",".xls",".xlsx",".csv",".txt",".jpg",".jpeg",".png",".webp",".gif",".zip",".mp4",".webm",".mp3",".wav"]);

export const gemini = {
  apiKey: process.env.GEMINI_API_KEY || "",
  model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
  ragTopK: Number(process.env.RAG_TOP_K || 6),
  ragMinScore: Number(process.env.RAG_MIN_SCORE || 0.08),
};
