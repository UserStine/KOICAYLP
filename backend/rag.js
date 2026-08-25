import fs from "node:fs";
import path from "node:path";

const DEFAULT_TOP_K = 6;
const DEFAULT_MIN_SCORE = 0.08;
const MAX_SOURCE_CHARS = 2200;
const MAX_CONTEXT_CHARS = 10000;

function clean(value, max = 5000) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function tokenize(value) {
  return clean(value, 12000)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1)
    .slice(0, 350);
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

export function buildRagChunks(baseDir, databaseKnowledge = []) {
  const chunks = [];

  // Curated knowledge now lives in Supabase. JSON files under /knowledge are
  // retained only as migration/seed material and are not read at runtime.
  for (const doc of databaseKnowledge || []) {
    const chunk = makeChunk({
      id: `knowledge:${doc.id}`,
      title: doc.title,
      category: doc.category,
      source: doc.source || "KOICA YLP knowledge base",
      text: doc.content || doc.text,
    });
    if (chunk.id && chunk.text) chunks.push(chunk);
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
        text: `${resource.title}. ${resource.description || resource.note || ""} ${resource.type ? `Type: ${resource.type}.` : ""}`,
      }));
    }
  } catch (error) {
    console.error(`[rag] content_load_failed error=${error.message}`);
  }

  const unique = new Map();
  for (const chunk of chunks) if (chunk.id && chunk.text) unique.set(chunk.id, chunk);
  return [...unique.values()];
}

function lexicalScores(query, chunks) {
  const queryTokens = tokenize(query);
  const querySet = new Set(queryTokens);
  const normalizedQuery = clean(query, 700).toLowerCase();

  const expansions = [
    { match: /\bapply|application|submit|submission|documents?|form\b/, terms: ["apply", "application", "submission", "documents", "form", "screening", "download"] },
    { match: /\beligib|qualif|criteria|age|degree|experience\b/, terms: ["eligible", "eligibility", "criteria", "required", "age", "experience"] },
    { match: /\btrack|public sector|private sector|government|startup|entrepreneur\b/, terms: ["track", "public", "private", "sector", "government", "entrepreneur"] },
    { match: /\bschedule|calendar|when|date|day|august|session|training\b/, terms: ["schedule", "timetable", "day", "session", "time", "training"] },
    { match: /\bvisa|passport|travel|korea|ghana\b/, terms: ["visa", "passport", "travel", "ghana", "korea"] },
    { match: /\bcost|pay|fee|fund|covered|scholarship\b/, terms: ["cost", "pay", "funded", "covered", "fee"] },
    { match: /\bcontact|email|help|support|office\b/, terms: ["contact", "email", "support", "office"] },
    { match: /\bphase|online|local|invitational\b/, terms: ["phase", "online", "local", "invitational", "training"] },
    { match: /\balumni|after|community|club|network\b/, terms: ["alumni", "community", "club", "networking"] },
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

    const haystack = `${chunks[index].title} ${chunks[index].category} ${chunks[index].text}`.toLowerCase();
    if (normalizedQuery.length >= 4 && haystack.includes(normalizedQuery)) score += 5;

    const dateMatch = normalizedQuery.match(/\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\b/);
    if (dateMatch && haystack.includes(dateMatch[0])) score += 8;

    if (/\bapply|application|submit|submission|documents?|form\b/.test(normalizedQuery) && chunks[index].category === "application") score += 4;
    if (/\beligib|qualif|criteria|age\b/.test(normalizedQuery) && chunks[index].category === "eligibility") score += 4;
    if (/\btrack|public sector|private sector\b/.test(normalizedQuery) && chunks[index].category === "tracks") score += 4;
    if (/\bschedule|calendar|when|date|day|session\b/.test(normalizedQuery) && chunks[index].category === "schedule") score += 4;
    if (/\bcontact|email|support\b/.test(normalizedQuery) && chunks[index].category === "support") score += 4;

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
  const modelName = String(model || "gemini-embedding-001").replace(/^models\//, "");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: `models/${modelName}`,
        content: { parts: [{ text: clean(text, 8000) }] },
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini embedding request failed (${response.status}) ${detail.slice(0, 180)}`);
  }

  const data = await response.json();
  return data.embedding?.values || null;
}

export async function createEmbeddingIndex({ baseDir, apiKey, model = "gemini-embedding-001", databaseKnowledge = [] }) {
  const chunks = buildRagChunks(baseDir, databaseKnowledge);
  if (!apiKey) throw new Error("GEMINI_API_KEY is required to build the RAG index.");

  const index = [];
  for (const chunk of chunks) {
    const embedding = await embedText(`${chunk.title}\n${chunk.text}`, apiKey, model);
    index.push({ ...chunk, embedding });
  }

  return {
    version: 2,
    provider: "gemini",
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
  embeddingModel = "gemini-embedding-001",
  topK = DEFAULT_TOP_K,
  minScore = DEFAULT_MIN_SCORE,
  indexPath = path.join(baseDir, "data", "rag-index.json"),
  databaseKnowledge = [],
}) {
  const liveChunks = buildRagChunks(baseDir, databaseKnowledge);
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

  const indexMatchesCurrentProvider = !index?.provider || index.provider === "gemini";
  const indexedCandidates = index?.chunks?.length && indexMatchesCurrentProvider ? index.chunks : [];
  const indexedIds = new Set(indexedCandidates.map((item) => item.id));
  const liveOnly = liveChunks.filter((item) => !indexedIds.has(item.id));
  const baseCandidates = indexedCandidates.length ? [...indexedCandidates, ...liveOnly] : liveChunks;

  const candidates = baseCandidates.map((chunk) => {
    const lexicalScore = lexicalById.get(chunk.id) || 0;
    const vectorScore = queryEmbedding && chunk.embedding ? Math.max(0, cosineSimilarity(queryEmbedding, chunk.embedding)) : 0;
    const score = queryEmbedding ? (vectorScore * 0.80) + (lexicalScore * 0.20) : lexicalScore;
    return { ...chunk, score, vectorScore, lexicalScore };
  });

  const selected = candidates
    .filter((item) => item.score >= Number(minScore))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(Number(topK) || DEFAULT_TOP_K, 10)));

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
    mode: queryEmbedding ? "gemini-hybrid-vector" : "lexical-fallback",
    chunkCount: liveChunks.length,
  };
}
