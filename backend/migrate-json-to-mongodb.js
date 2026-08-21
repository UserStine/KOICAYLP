import { loadEnvFile } from "node:process";
try { loadEnvFile(); } catch {}

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname);
const dataDir = path.join(backendDir, "data");
const uri = String(process.env.MONGODB_URI || "").trim();
const dbName = String(process.env.MONGODB_DB || "koica_ylp").trim();
const collectionName = String(process.env.MONGODB_STORE_COLLECTION || "app_store").trim();

if (!uri) throw new Error("MONGODB_URI is required.");

const files = [
  ["participants.json", []],
  ["content.json", { modules: [], announcements: [], resources: [], calendar: [] }],
  ["progress.json", {}],
];

function loadJson(fileName, fallback) {
  const fullPath = path.join(dataDir, fileName);
  if (!fs.existsSync(fullPath)) return structuredClone(fallback);
  const value = JSON.parse(fs.readFileSync(fullPath, "utf8"));

  if (fileName === "participants.json" && Array.isArray(value)) {
    for (const participant of value) {
      if (participant && typeof participant === "object") delete participant.pin;
    }
  }

  return value;
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  for (const [fileName, fallback] of files) {
    const value = loadJson(fileName, fallback);
    await collection.updateOne(
      { _id: fileName },
      {
        $set: { value, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    const count = Array.isArray(value)
      ? value.length
      : fileName === "content.json"
        ? (value.modules || []).length
        : Object.keys(value || {}).length;

    console.log(`[mongo-migrate] ${fileName}: imported (${count})`);
  }

  await db.command({ ping: 1 });
  console.log(`[mongo-migrate] complete database=${db.databaseName} collection=${collectionName}`);
} finally {
  await client.close();
}
