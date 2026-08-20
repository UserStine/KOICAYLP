/* ==========================================================================
   Import a participant roster into the LMS.

   Usage:   node scripts/import-roster.mjs path/to/roster.csv

   Expected CSV columns (header row required, order doesn't matter):
     name,pin,country,track,cohort
   Example row:
     Justice Mensah,KYLP054,Ghana,public,2026-2027

   - track   : "public" or "private"
   - cohort  : any label you use, e.g. 2026-2027
   - PINs are hashed with scrypt and are never stored in plaintext.
   - Optional email column supports password-reset emails.
   ========================================================================== */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "data", "participants.json");

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node server/scripts/import-roster.mjs <roster.csv>");
  process.exit(1);
}

/* minimal CSV parser, handles quoted fields containing commas */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
const header = rows[0].map((h) => h.trim().toLowerCase());
const idx = (k) => header.indexOf(k);

["name", "pin"].forEach((req) => {
  if (idx(req) === -1) {
    console.error(`CSV is missing a "${req}" column. Found: ${header.join(", ")}`);
    process.exit(1);
  }
});

const seenPins = new Set();
const participants = rows.slice(1).map((r, i) => {
  const name = (r[idx("name")] || "").trim();
  const pin = (r[idx("pin")] || "").trim().toUpperCase();

  if (!name || !pin) {
    console.warn(`Row ${i + 2}: missing name or PIN, skipped.`);
    return null;
  }
  if (seenPins.has(pin)) {
    console.warn(`Row ${i + 2}: PIN ${pin} is duplicated, skipped.`);
    return null;
  }
  seenPins.add(pin);

  const salt = crypto.randomBytes(16).toString("hex");
  return {
    id: pin.toLowerCase(),
    name,
    salt,
    pinHash: crypto.scryptSync(pin, salt, 32).toString("hex"),
    email: idx("email") > -1 ? (r[idx("email")] || "").trim().toLowerCase() : "",
    country: idx("country") > -1 ? (r[idx("country")] || "").trim() : "",
    track: idx("track") > -1 ? (r[idx("track")] || "public").trim().toLowerCase() : "public",
    cohort: idx("cohort") > -1 ? (r[idx("cohort")] || "").trim() : "",
    role: idx("role") > -1 ? (r[idx("role")] || "participant").trim() : "participant",
  };
}).filter(Boolean);

fs.writeFileSync(OUT, JSON.stringify(participants, null, 2));
console.log(`Imported ${participants.length} participant(s) -> ${OUT}`);
