import { loadEnvFile } from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { saveKnowledgeArticle, listKnowledgeArticles } from "../supabase-store.js";

try { loadEnvFile(); } catch {}
const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const seedPath = path.join(backendDir, "knowledge", "public-knowledge.json");
const docs = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const existing = await listKnowledgeArticles();
const keys = new Set(existing.map((x) => `${x.title}::${x.language}`));
let inserted = 0;
for (const doc of docs) {
  const title = String(doc.title || "").replaceAll("Young Leaders", "Youth Leaders");
  const content = String(doc.text || doc.content || "").replaceAll("Young Leaders", "Youth Leaders");
  const key = `${title}::en`;
  if (keys.has(key)) continue;
  await saveKnowledgeArticle({ title, category: doc.category || "program", content, language: "en", source: doc.source || "KOICA YLP knowledge base", isPublished: true });
  keys.add(key); inserted += 1;
}
console.log(`[knowledge] inserted ${inserted} article(s). Total: ${keys.size}`);
