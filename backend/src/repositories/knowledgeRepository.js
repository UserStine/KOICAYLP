import * as supabase from "../../supabase-store.js";
import fs from "node:fs";
import path from "node:path";
import { backendDir } from "../config/env.js";

export async function listKnowledgeArticles({ publishedOnly = false } = {}) {
  if (supabase.isSupabaseConfigured()) return supabase.listKnowledgeArticles({ publishedOnly });
  let seed = [];
  try { seed = JSON.parse(fs.readFileSync(path.join(backendDir, "knowledge", "public-knowledge.json"), "utf8")); } catch {}
  return Array.isArray(seed) ? seed.map((x) => ({ ...x, content: x.content || x.text || "", language: x.language || "en", is_published: true })) : [];
}
export const listPublishedKnowledgeArticles = () => listKnowledgeArticles({ publishedOnly: true });
export async function saveKnowledgeArticle(values) {
  if (!supabase.isSupabaseConfigured()) throw Object.assign(new Error("Knowledge editing requires Supabase."), { status: 503 });
  return supabase.saveKnowledgeArticle(values);
}
export async function deleteKnowledgeArticle(id) {
  if (!supabase.isSupabaseConfigured()) throw Object.assign(new Error("Knowledge editing requires Supabase."), { status: 503 });
  return supabase.deleteKnowledgeArticle(id);
}
