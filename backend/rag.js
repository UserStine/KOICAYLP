import fs from "node:fs";
import path from "node:path";

const DEFAULT_TOP_K = 5;
const DEFAULT_MIN_SCORE = 0.08;
const MAX_SOURCE_CHARS = 1800;
const MAX_CONTEXT_CHARS = 7000;

function clean(value, max = 5000) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function tokenize(value) {
  return clean(value, 10000)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1)
    .slice(0, 250);
}

function makeChunk({ id, title, category, text, source = "KOICA YLP knowledge base" }) {
  return {
    id: clean(id, 120),
    title: clean(title, 180),
    category: clean(category, 80),
    source: clean(source, 180),
    text: clean(text, MAX_SOURCE_CHARS),
  };
}

export function buildRagChunks(baseDir) {
  const chunks = [];
  const knowledgePath = path.join(baseDir, "knowledge", "public-knowledge.json");

  try {
    const docs = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));
    for (const doc of docs) {
      const chunk = makeChunk(doc);
      if (chunk.id && chunk.text) chunks.push(chunk);
    }
  } catch (error) {
    console.error(`[rag] knowledge_load_failed error=${error.message}`);
  }

  const contentPath = path.join(baseDir, "data", "content.json");
  try {
    const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));

    for (const announcement of content.announcements || []) {
      chunks.push(makeChunk({
        id: `announcement:${announcement.id}`,
        title: announcement.title,
        category: "announcement",
        source: "Programme announcement",
        text: `${announcement.title}. ${announcement.body}`,
      }));
    }

    for (const module of content.modules || []) {
      const lessonText = (module.lessons || [])
        .map((lesson) => {
          const details = [lesson.time, lesson.facilitator].filter(Boolean).join("; ");
          return `${lesson.title}${details ? ` (${details})` : ""}`;
        })
        .join(". ");

      chunks.push(makeChunk({
        id: `module:${module.id}`,
        title: module.title,
        category: "schedule",
        source: "Programme timetable",
        text: `${module.title}. Track: ${module.track || "all"}. Phase: ${module.phase || ""}. ${module.summary || ""}. Sessions: ${lessonText}`,
      }));
    }

    for (const resource of content.resources || []) {
      chunks.push(makeChunk({
        id: `resource:${resource.id}`,
        title: resource.title,
        category: "resource",
        source: "Learning resources",
        text: `${resource.title}. ${resource.description || ""} ${resource.type ? `Type: ${resource.type}.` : ""}`,
      }));
    }
  } catch (error) {
    console.error(`[rag] content_load_failed error=${error.message}`);
  }

  const unique = new Map();
  for (const chunk of chunks) {
    if (chunk.id && chunk.text) unique.set(chunk.id, chunk);
  }
  return [...unique.values()];
}

function lexicalScores(query, chunks) {
  const queryTokens = tokenize(query);
  const querySet = new Set(queryTokens);
  const normalizedQuery = clean(query, 500).toLowerCase();

  const expansions = [
    { match: /\bapply|application|submit|submission|documents?\b/, terms: ["apply", "application", "submission", "documents", "screening"] },
    { match: /\beligib|qualif|criteria|age\b/, terms: ["eligible", "eligibility", "criteria", "required", "age"] },
    { match: /\btrack|public sector|private sector\b/, terms: ["track", "public", "private", "sector"] },
    { match: /\bschedule|calendar|when|date|day|august|session\b/, terms: ["schedule", "timetable", "day", "session", "time"] },
    { match: /\bvisa|passport|travel\b/, terms: ["visa", "passport", "ghana", "korea"] },
    { match: /\bcost|pay|fee|fund|covered\b/, terms: ["cost", "pay", "funded", "covered"] },
  ];

  for (const expansion of expansions) {
    if (expansion.match.test(normalizedQuery)) {
      for (const term of expansion.terms) querySet.add(term);
    }
  }

  if (!querySet.size) return chunks.map(() => 0);

  const documentTokens = chunks.map((chunk) => tokenize(`${chunk.title} ${chunk.category} ${chunk.text}`));
  const docFrequency = new Map();

  for (const tokens of documentTokens) {
    for (const token of new Set(tokens)) {
      docFrequency.set(token, (docFrequency.get(token) || 0) + 1);
    }
  }

  return documentTokens.map((tokens, index) => {
    const frequencies = new Map();
    for (const token of tokens) frequencies.set(token, (frequencies.get(token) || 0) + 1);

    let score = 0;
    for (const token of querySet) {
      const tf = frequencies.get(token) || 0;
      if (!tf) continue;
      const df = docFrequency.get(token) || 0;
      const idf = Math.log(1 + (chunks.length + 1) / (df + 1));
      score += (1 + Math.log(tf)) * idf;
    }

    const exactPhrase = normalizedQuery;
    const haystack = `${chunks[index].title} ${chunks[index].text}`.toLowerCase();
    if (exactPhrase.length >= 4 && haystack.includes(exactPhrase)) score += 4;

    const dateMatch = normalizedQuery.match(/\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/);
    if (dateMatch && haystack.includes(dateMatch[0])) score += 8;

    if (/\bapply|application|submit|submission|documents?\b/.test(normalizedQuery) && chunks[index].category === "application") score += 3;
    if (/\beligib|qualif|criteria|age\b/.test(normalizedQuery) && chunks[index].category === "eligibility") score += 3;
    if (/\btrack|public sector|private sector\b/.test(normalizedQuery) && chunks[index].category === "tracks") score += 3;
    if (/\bschedule|calendar|when|date|day|august|session\b/.test(normalizedQuery) && chunks[index].category === "schedule") score += 3;

    return score;
  });
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedText(text, apiKey, model) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: clean(text, 8000) }),
  });

  if (!response.ok) {
    throw new Error(`embedding request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data?.[0]?.embedding || null;
}

export async function createEmbeddingIndex({ baseDir, apiKey, model = "text-embedding-3-small" }) {
  const chunks = buildRagChunks(baseDir);
  if (!apiKey) throw new Error("OPENAI_API_KEY is required to build the RAG index.");

  const index = [];
  for (const chunk of chunks) {
    const embedding = await embedText(`${chunk.title}\n${chunk.text}`, apiKey, model);
    index.push({ ...chunk, embedding });
  }

  return {
    version: 1,
    embeddingModel: model,
    generatedAt: new Date().toISOString(),
    chunks: index,
  };
}

let cachedIndex = null;
let cachedIndexPath = null;

function loadEmbeddingIndex(indexPath) {
  if (cachedIndexPath === indexPath) return cachedIndex;
  cachedIndexPath = indexPath;
  cachedIndex = null;

  try {
    const parsed = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    if (Array.isArray(parsed.chunks) && parsed.chunks.length) cachedIndex = parsed;
  } catch {
    // Lexical retrieval remains available when a vector index has not been generated yet.
  }
  return cachedIndex;
}

export async function retrieveRagContext({
  query,
  baseDir,
  apiKey,
  embeddingModel = "text-embedding-3-small",
  topK = DEFAULT_TOP_K,
  minScore = DEFAULT_MIN_SCORE,
  indexPath = path.join(baseDir, "data", "rag-index.json"),
}) {
  const liveChunks = buildRagChunks(baseDir);
  const lexical = lexicalScores(query, liveChunks);
  const maxLexical = Math.max(0, ...lexical);
  const lexicalById = new Map(liveChunks.map((chunk, index) => [chunk.id, maxLexical ? lexical[index] / maxLexical : 0]));

  const index = loadEmbeddingIndex(indexPath);
  let queryEmbedding = null;
  if (index?.chunks?.length && apiKey) {
    try {
      queryEmbedding = await embedText(query, apiKey, index.embeddingModel || embeddingModel);
    } catch (error) {
      console.warn(`[rag] query_embedding_failed error=${error.message}`);
    }
  }

  const candidates = (index?.chunks?.length ? index.chunks : liveChunks).map((chunk) => {
    const lexicalScore = lexicalById.get(chunk.id) || 0;
    const vectorScore = queryEmbedding && chunk.embedding ? Math.max(0, cosineSimilarity(queryEmbedding, chunk.embedding)) : 0;
    const score = queryEmbedding ? (vectorScore * 0.82) + (lexicalScore * 0.18) : lexicalScore;
    return { ...chunk, score, vectorScore, lexicalScore };
  });

  const selected = candidates
    .filter((item) => item.score >= Number(minScore))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(Number(topK) || DEFAULT_TOP_K, 8)));

  let totalChars = 0;
  const sources = [];
  const contextParts = [];

  for (const item of selected) {
    const text = clean(item.text, MAX_SOURCE_CHARS);
    if (!text || totalChars + text.length > MAX_CONTEXT_CHARS) continue;
    const ref = `S${sources.length + 1}`;
    sources.push({ ref, id: item.id, title: item.title, category: item.category, source: item.source, score: Number(item.score.toFixed(4)) });
    contextParts.push(`[${ref}] ${item.title}\n${text}`);
    totalChars += text.length;
  }

  return {
    context: contextParts.join("\n\n"),
    sources,
    mode: queryEmbedding ? "hybrid-vector" : "lexical-fallback",
  };
}
