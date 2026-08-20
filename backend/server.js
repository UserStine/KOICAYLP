/* ==========================================================================
   KOICA YLP, backend API
   Auth:  participant name + KOICA PIN (e.g. KYLP054)
   Store: JSON files in ./data (no database engine to install)
   Run:   npm run server      (from the project root)
   ========================================================================== */

import { loadEnvFile } from "node:process";
try { loadEnvFile(); } catch {}

import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "data");
const PORT = process.env.PORT || 4000;
const RESOURCE_DIR = path.join(__dirname, "uploads", "resources");
const PRESENTATION_DIR = path.join(__dirname, "uploads", "module-presentations");
const MAX_RESOURCE_BYTES = 50 * 1024 * 1024;
fs.mkdirSync(DATA, { recursive: true });
const ALLOWED_RESOURCE_EXTENSIONS = new Set([
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".csv", ".txt",
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".zip", ".mp4", ".webm", ".mp3", ".wav"
]);
fs.mkdirSync(RESOURCE_DIR, { recursive: true });
fs.mkdirSync(PRESENTATION_DIR, { recursive: true });

/* Sign tokens with a secret. Set YLP_SECRET in production -
   a random fallback is generated per boot, which logs everyone out on restart. */
const SECRET = process.env.YLP_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.YLP_SECRET) {
  console.warn("[ylp] No YLP_SECRET set, using a temporary secret (sessions end on restart).");
}

/* ---------------- tiny JSON store ---------------- */
const read = (f, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));
  } catch {
    return fallback;
  }
};
const write = (f, obj) =>
  fs.writeFileSync(path.join(DATA, f), JSON.stringify(obj, null, 2));

/* ---------------- PIN hashing ---------------- */
/* PINs are stored as scrypt hashes, never plaintext. See scripts/import-roster.mjs */
export const hashPin = (pin, salt) =>
  crypto.scryptSync(pin.trim().toUpperCase(), salt, 32).toString("hex");

const verifyPin = (pin, participant) => {
  try {
    const attempt = hashPin(pin, participant.salt);
    return crypto.timingSafeEqual(
      Buffer.from(attempt, "hex"),
      Buffer.from(participant.pinHash, "hex")
    );
  } catch {
    return false;
  }
};

/* names are matched loosely: case, spacing and punctuation don't matter */
const normalizeName = (s) =>
  (s || "").toLowerCase().normalize("NFKD").replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();

/* ---------------- tokens (HMAC-signed, 12h) ---------------- */
const TOKEN_TTL = 12 * 60 * 60 * 1000;

function issueToken(id) {
  const body = Buffer.from(JSON.stringify({ id, exp: Date.now() + TOKEN_TTL })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function readToken(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

function auth(req, res, next) {
  const data = readToken((req.headers.authorization || "").replace("Bearer ", ""));
  if (!data) return res.status(401).json({ error: "Session expired. Please log in again." });
  const participant = read("participants.json", []).find((p) => p.id === data.id);
  if (!participant) return res.status(401).json({ error: "Account not found." });
  req.user = participant;
  next();
}

/* ---------------- brute-force throttle ---------------- */
/* PINs are short, so limit attempts per IP: 8 tries, then a 15-minute lockout. */
const attempts = new Map();
const MAX_TRIES = 8;
const LOCKOUT = 15 * 60 * 1000;

function throttle(req, res, next) {
  const ip = req.ip;
  const rec = attempts.get(ip);
  if (rec && rec.count >= MAX_TRIES && Date.now() - rec.first < LOCKOUT) {
    const mins = Math.ceil((LOCKOUT - (Date.now() - rec.first)) / 60000);
    return res.status(429).json({ error: `Too many attempts. Try again in ${mins} minute(s).` });
  }
  if (rec && Date.now() - rec.first >= LOCKOUT) attempts.delete(ip);
  next();
}
const noteFail = (ip) => {
  const rec = attempts.get(ip) || { count: 0, first: Date.now() };
  rec.count += 1;
  attempts.set(ip, rec);
};

/* ---------------- app ---------------- */
const app = express();
app.set("trust proxy", 1);

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients (health checks, curl, server-to-server).
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: false,
}));

app.use((req, res, next) => {
  const isFileUpload = req.method === "POST" && (req.path === "/api/admin/resources" || req.path === "/api/admin/modules");
  return express.json({ limit: isFileUpload ? "220mb" : "1mb" })(req, res, next);
});

const publicUser = (p) => ({
  id: p.id, name: p.name, pin: p.pin, country: p.country,
  track: p.track, cohort: p.cohort, role: p.role || "participant",
});

/* --- POST /api/login  { name, pin } --- */
app.post("/api/login", throttle, (req, res) => {
  const { name = "", pin = "" } = req.body || {};
  if (!name.trim() || !pin.trim())
    return res.status(400).json({ error: "Enter both your name and your KOICA PIN." });

  const participants = read("participants.json", []);
  const match = participants.find(
    (p) => p.pin.toUpperCase() === pin.trim().toUpperCase() && normalizeName(p.name) === normalizeName(name)
  );

  if (!match || !verifyPin(pin, match)) {
    noteFail(req.ip);
    /* deliberately vague: don't reveal whether the PIN or the name was wrong */
    return res.status(401).json({ error: "We couldn't match that name and PIN. Check both and try again." });
  }

  attempts.delete(req.ip);
  res.json({ token: issueToken(match.id), user: publicUser(match) });
});

/* --- GET /api/me --- */
app.get("/api/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));

/* --- GET /api/dashboard --- */
app.get("/api/dashboard", auth, (req, res) => {
  const content = read("content.json", { modules: [], announcements: [], sessions: [] });
  const progress = read("progress.json", {})[req.user.id] || { lessons: {} };

  const track = req.user.track;
  const modules = content.modules.filter((m) => !m.track || m.track === track);
  const allLessons = modules.flatMap((m) => m.lessons.map((l) => `${m.id}:${l.id}`));
  const done = allLessons.filter((k) => progress.lessons[k]);

  res.json({
    user: publicUser(req.user),
    announcements: content.announcements,
    progress: {
      completed: done.length,
      total: allLessons.length,
      percent: allLessons.length ? Math.round((done.length / allLessons.length) * 100) : 0,
    },
    modules: modules.map((m) => {
      const total = m.lessons.length;
      const finished = m.lessons.filter((l) => progress.lessons[`${m.id}:${l.id}`]).length;
      return { ...m, completed: finished, total, percent: total ? Math.round((finished / total) * 100) : 0 };
    }),
  });
});

/* --- GET /api/modules/:id --- */
app.get("/api/modules/:id", auth, (req, res) => {
  const content = read("content.json", { modules: [] });
  const mod = content.modules.find((m) => m.id === req.params.id);
  if (!mod) return res.status(404).json({ error: "Module not found." });
  if (mod.track && mod.track !== req.user.track)
    return res.status(403).json({ error: "That module belongs to the other track." });

  const progress = read("progress.json", {})[req.user.id] || { lessons: {} };
  res.json({
    module: {
      ...mod,
      lessons: mod.lessons.map((l) => ({ ...l, done: !!progress.lessons[`${mod.id}:${l.id}`] })),
    },
  });
});


app.get("/api/modules/:id/presentations/:presentationId/download", auth, (req, res) => {
  const content = read("content.json", { modules: [] });
  const mod = content.modules.find((m) => m.id === req.params.id);
  if (!mod) return res.status(404).json({ error: "Module not found." });
  if (mod.track && mod.track !== req.user.track)
    return res.status(403).json({ error: "That module belongs to the other track." });

  const presentation = (mod.presentations || []).find((p) => p.id === req.params.presentationId);
  if (!presentation?.filePath) return res.status(404).json({ error: "Presentation not found." });

  const fullPath = path.resolve(__dirname, presentation.filePath);
  const safeRoot = path.resolve(PRESENTATION_DIR) + path.sep;
  if (!fullPath.startsWith(safeRoot) || !fs.existsSync(fullPath))
    return res.status(404).json({ error: "The presentation file is missing." });

  res.download(fullPath, presentation.originalFileName || path.basename(fullPath));
});

/* --- POST /api/progress  { moduleId, lessonId, done } --- */
app.post("/api/progress", auth, (req, res) => {
  const { moduleId, lessonId, done } = req.body || {};
  if (!moduleId || !lessonId) return res.status(400).json({ error: "Missing module or lesson." });

  const all = read("progress.json", {});
  const mine = all[req.user.id] || { lessons: {} };
  const key = `${moduleId}:${lessonId}`;
  if (done) mine.lessons[key] = new Date().toISOString();
  else delete mine.lessons[key];
  all[req.user.id] = mine;
  write("progress.json", all);

  res.json({ ok: true, done: !!done });
});

/* --- GET /api/resources --- */
app.get("/api/resources", auth, (req, res) => {
  const content = read("content.json", { resources: [] });
  const list = (content.resources || []).filter((r) => !r.track || r.track === req.user.track);
  res.json({ resources: list });
});

app.get("/api/resources/:id/download", auth, (req, res) => {
  const content = read("content.json", { resources: [] });
  const resource = (content.resources || []).find((r) => r.id === req.params.id);
  if (!resource) return res.status(404).json({ error: "Resource not found." });
  if (resource.track && resource.track !== req.user.track)
    return res.status(403).json({ error: "That resource belongs to the other track." });
  if (!resource.filePath) return res.status(404).json({ error: "No uploaded file is attached to this resource." });

  const fullPath = path.resolve(__dirname, resource.filePath);
  const safeRoot = path.resolve(RESOURCE_DIR) + path.sep;
  if (!fullPath.startsWith(safeRoot) || !fs.existsSync(fullPath))
    return res.status(404).json({ error: "The resource file is missing." });

  res.download(fullPath, resource.originalFileName || path.basename(fullPath));
});


/* ==========================================================================
   ADMIN API
   Any participant whose roster row has role=admin can manage content.
   Set it in your CSV with a "role" column.
   ========================================================================== */
function adminOnly(req, res, next) {
  if ((req.user.role || "participant") !== "admin")
    return res.status(403).json({ error: "Admin access only." });
  next();
}

const nextId = (list, prefix) => {
  let n = 1;
  const used = new Set(list.map((x) => x.id));
  while (used.has(`${prefix}${n}`)) n += 1;
  return `${prefix}${n}`;
};

/* --- GET /api/admin/content : everything, unfiltered --- */
app.get("/api/admin/content", auth, adminOnly, (req, res) => {
  const content = read("content.json", { modules: [], announcements: [], resources: [] });
  res.json(content);
});

/* --- POST /api/admin/modules : create/update module + optional PDF/PowerPoint attachments --- */
app.post("/api/admin/modules", auth, adminOnly, (req, res) => {
  const { id, title, summary, phase, track, lessons, presentations = [], presentationUploads = [] } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "A module needs a title." });

  const content = read("content.json", { modules: [] });
  content.modules = content.modules || [];
  const idx = content.modules.findIndex((m) => m.id === id);
  const existing = idx > -1 ? content.modules[idx] : null;
  const existingPresentations = existing?.presentations || [];
  const keepIds = new Set((presentations || []).map((p) => p.id).filter(Boolean));

  // Remove presentation files the admin removed from the module editor.
  for (const old of existingPresentations) {
    if (keepIds.has(old.id) || !old.filePath) continue;
    const oldPath = path.resolve(__dirname, old.filePath);
    const safeRoot = path.resolve(PRESENTATION_DIR) + path.sep;
    if (oldPath.startsWith(safeRoot) && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const keptPresentations = existingPresentations.filter((p) => keepIds.has(p.id));
  const uploadedPresentations = [];
  for (const file of presentationUploads || []) {
    const originalFileName = path.basename(String(file?.name || "module-file"));
    const ext = path.extname(originalFileName).toLowerCase();
    if (![".pdf", ".ppt", ".pptx"].includes(ext))
      return res.status(400).json({ error: "Module files must be PDF, PPT, or PPTX files." });

    const match = String(file?.dataUrl || "").match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) return res.status(400).json({ error: "A module file could not be read." });

    let buffer;
    try { buffer = Buffer.from(match[2], "base64"); }
    catch { return res.status(400).json({ error: "A module file is invalid." }); }
    if (!buffer.length || buffer.length > MAX_RESOURCE_BYTES)
      return res.status(400).json({ error: "Module files must be 50 MB or smaller." });

    const storedName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    const fullPath = path.join(PRESENTATION_DIR, storedName);
    fs.writeFileSync(fullPath, buffer);
    uploadedPresentations.push({
      id: `p-${crypto.randomBytes(6).toString("hex")}`,
      filePath: path.relative(__dirname, fullPath).replaceAll("\\", "/"),
      originalFileName,
      mime: match[1] || file.mime || "application/octet-stream",
      size: buffer.length,
    });
  }

  const clean = {
    title: title.trim(),
    summary: (summary || "").trim(),
    phase: (phase || "Online Training").trim(),
    lessons: (lessons || []).map((l, i) => ({
      id: l.id || `l${i + 1}`,
      title: (l.title || "").trim(),
      type: ["video", "reading", "task", "lecture", "workshop", "visit", "event", "self-study"].includes(l.type) ? l.type : "reading",
      minutes: Number(l.minutes) || 0,
      time: (l.time || "").trim(),
      facilitator: (l.facilitator || "").trim(),
    })).filter((l) => l.title),
    presentations: [...keptPresentations, ...uploadedPresentations],
  };
  if (track === "public" || track === "private") clean.track = track;

  if (idx > -1) {
    const kept = { ...content.modules[idx], ...clean };
    if (!clean.track) delete kept.track;
    content.modules[idx] = kept;
  } else {
    content.modules.push({ id: nextId(content.modules, "m"), ...clean });
  }
  write("content.json", content);
  res.json({ ok: true, modules: content.modules });
});

/* --- DELETE /api/admin/modules/:id --- */
app.delete("/api/admin/modules/:id", auth, adminOnly, (req, res) => {
  const content = read("content.json", { modules: [] });
  const existing = (content.modules || []).find((m) => m.id === req.params.id);
  for (const presentation of existing?.presentations || []) {
    if (!presentation.filePath) continue;
    const fullPath = path.resolve(__dirname, presentation.filePath);
    const safeRoot = path.resolve(PRESENTATION_DIR) + path.sep;
    if (fullPath.startsWith(safeRoot) && fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  content.modules = (content.modules || []).filter((m) => m.id !== req.params.id);
  write("content.json", content);
  res.json({ ok: true, modules: content.modules });
});

/* --- POST /api/admin/announcements --- */
app.post("/api/admin/announcements", auth, adminOnly, (req, res) => {
  const { id, title, body, tag } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "An announcement needs a title." });

  const content = read("content.json", { announcements: [] });
  content.announcements = content.announcements || [];
  const clean = { title: title.trim(), body: (body || "").trim(), tag: (tag || "News").trim() };
  const idx = content.announcements.findIndex((a) => a.id === id);
  if (idx > -1) content.announcements[idx] = { ...content.announcements[idx], ...clean };
  else content.announcements.unshift({ id: nextId(content.announcements, "a"), ...clean });
  write("content.json", content);
  res.json({ ok: true, announcements: content.announcements });
});

app.delete("/api/admin/announcements/:id", auth, adminOnly, (req, res) => {
  const content = read("content.json", { announcements: [] });
  content.announcements = (content.announcements || []).filter((a) => a.id !== req.params.id);
  write("content.json", content);
  res.json({ ok: true, announcements: content.announcements });
});

/* --- POST /api/admin/resources : upload file + create/update metadata --- */
app.post("/api/admin/resources", auth, adminOnly, (req, res) => {
  const { id, title, type, note, track, file } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "A resource needs a title." });

  const content = read("content.json", { resources: [] });
  content.resources = content.resources || [];
  const idx = content.resources.findIndex((r) => r.id === id);
  const existing = idx > -1 ? content.resources[idx] : null;

  let uploaded = null;
  if (file) {
    const originalFileName = path.basename(String(file.name || "resource"));
    const ext = path.extname(originalFileName).toLowerCase();
    if (!ALLOWED_RESOURCE_EXTENSIONS.has(ext))
      return res.status(400).json({ error: "That file type is not allowed." });

    const match = String(file.dataUrl || "").match(/^data:([^;]+);base64,(.+)$/s);
    if (!match) return res.status(400).json({ error: "The uploaded file could not be read." });

    let buffer;
    try { buffer = Buffer.from(match[2], "base64"); }
    catch { return res.status(400).json({ error: "The uploaded file is invalid." }); }

    if (!buffer.length || buffer.length > MAX_RESOURCE_BYTES)
      return res.status(400).json({ error: "Files must be 50 MB or smaller." });

    const storedName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    const fullPath = path.join(RESOURCE_DIR, storedName);
    fs.writeFileSync(fullPath, buffer);
    uploaded = {
      filePath: path.relative(__dirname, fullPath).replaceAll("\\", "/"),
      originalFileName,
      mime: match[1] || file.mime || "application/octet-stream",
      size: buffer.length,
      type: ext.slice(1).toUpperCase() || (type || "FILE").trim().toUpperCase(),
    };
  } else if (!existing?.filePath) {
    return res.status(400).json({ error: "Choose a file to upload." });
  }

  const clean = {
    title: title.trim(),
    type: uploaded?.type || (type || existing?.type || "FILE").trim().toUpperCase(),
    note: (note || "").trim(),
    ...(uploaded || {}),
  };
  if (track === "public" || track === "private") clean.track = track;

  if (existing) {
    const kept = { ...existing, ...clean };
    delete kept.url;
    if (!clean.track) delete kept.track;
    content.resources[idx] = kept;

    if (uploaded && existing.filePath && existing.filePath !== uploaded.filePath) {
      const oldPath = path.resolve(__dirname, existing.filePath);
      const safeRoot = path.resolve(RESOURCE_DIR) + path.sep;
      if (oldPath.startsWith(safeRoot) && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  } else {
    content.resources.push({ id: nextId(content.resources, "r"), ...clean });
  }

  write("content.json", content);
  res.json({ ok: true, resources: content.resources });
});

app.delete("/api/admin/resources/:id", auth, adminOnly, (req, res) => {
  const content = read("content.json", { resources: [] });
  const existing = (content.resources || []).find((r) => r.id === req.params.id);
  if (existing?.filePath) {
    const fullPath = path.resolve(__dirname, existing.filePath);
    const safeRoot = path.resolve(RESOURCE_DIR) + path.sep;
    if (fullPath.startsWith(safeRoot) && fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  content.resources = (content.resources || []).filter((r) => r.id !== req.params.id);
  write("content.json", content);
  res.json({ ok: true, resources: content.resources });
});

/* --- GET /api/admin/participants : roster + progress overview --- */
app.get("/api/admin/participants", auth, adminOnly, (req, res) => {
  const participants = read("participants.json", []);
  const progress = read("progress.json", {});
  const content = read("content.json", { modules: [] });

  const rows = participants.map((p) => {
    const mine = progress[p.id] || { lessons: {} };
    const mods = content.modules.filter((m) => !m.track || m.track === p.track);
    const total = mods.reduce((n, m) => n + m.lessons.length, 0);
    const done = mods.reduce(
      (n, m) => n + m.lessons.filter((l) => mine.lessons[`${m.id}:${l.id}`]).length, 0);
    return {
      id: p.id, name: p.name, pin: p.pin, country: p.country,
      track: p.track, role: p.role || "participant",
      completed: done, total, percent: total ? Math.round((done / total) * 100) : 0,
    };
  });
  res.json({ participants: rows });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[ylp] API listening on port ${PORT}`);
  console.log(`[ylp] Allowed frontend origin(s): ${allowedOrigins.join(", ")}`);
});
