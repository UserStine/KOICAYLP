import { loadEnvFile } from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEmbeddingIndex } from "../rag.js";
import { listPublishedKnowledgeArticles } from "../supabase-store.js";

try { loadEnvFile(); } catch {}

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(backendDir, "data", "rag-index.json");
const model = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

const databaseKnowledge = await listPublishedKnowledgeArticles();

const index = await createEmbeddingIndex({
  baseDir: backendDir,
  databaseKnowledge,
  apiKey: process.env.GEMINI_API_KEY,
  model,
});

fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
console.log(`[rag] wrote ${index.chunks.length} chunks to ${outputPath}`);
console.log(`[rag] provider: gemini`);
console.log(`[rag] embedding model: ${index.embeddingModel}`);
