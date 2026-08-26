import fs from "node:fs";
import path from "node:path";
import { dataDir, seedDataDir } from "../config/env.js";

export function readJson(fileName, fallback) {
  for (const file of [path.join(dataDir, fileName), path.join(seedDataDir, fileName)]) {
    try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
  }
  return fallback;
}

export function writeJson(fileName, value) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, fileName), JSON.stringify(value, null, 2));
}
