import { loadEnvFile } from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "..");

try {
  loadEnvFile(path.join(backendDir, ".env"));
} catch {}

const { isSupabaseConfigured, listParticipants, upsertParticipants } = await import("../supabase-store.js");

if (!isSupabaseConfigured()) {
  console.error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env.");
  process.exit(1);
}

const sourcePath = path.join(backendDir, "data", "participants.json");
const participants = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

if (!Array.isArray(participants)) {
  throw new Error("backend/data/participants.json must contain an array.");
}

const unsafe = participants.filter((p) => Object.hasOwn(p, "pin"));
if (unsafe.length) {
  throw new Error(`Migration stopped: ${unsafe.length} participant record(s) still contain plaintext PINs.`);
}

console.log(`Importing ${participants.length} participants into Supabase...`);
await upsertParticipants(participants);

const saved = await listParticipants();
console.log(`Supabase now contains ${saved.length} participant records.`);

if (saved.length !== participants.length) {
  console.warn(`Count mismatch: JSON=${participants.length}, Supabase=${saved.length}. Review before switching production traffic.`);
  process.exitCode = 2;
} else {
  console.log("Participant migration completed successfully.");
}
