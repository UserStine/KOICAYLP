import { readJson, writeJson } from "./jsonStore.js";
export function getUserProgress(userId) { return readJson("progress.json", {})[userId] || { lessons: {} }; }
export function saveUserProgress(userId, progress) { const all = readJson("progress.json", {}); all[userId] = progress; writeJson("progress.json", all); return progress; }
