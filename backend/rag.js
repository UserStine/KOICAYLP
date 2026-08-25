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
    {
      match: /\b(apply|application|submit|submission|documents?|form|postuler|candidature|soumettre|dossier|formulaire)\b|지원|신청|접수|서류|양식/i,
      terms: ["apply", "application", "submission", "documents", "form", "screening", "download", "postuler", "candidature", "dossier", "지원", "신청", "접수", "서류"],
    },
    {
      match: /\b(eligib|qualif|criteria|age|degree|experience|admissibilit|critere|diplome)\b|자격|요건|기준|나이|연령|경력|학력/i,
      terms: ["eligible", "eligibility", "criteria", "required", "age", "experience", "admissibilite", "critere", "자격", "요건", "기준", "경력"],
    },
    {
      match: /\b(track|public sector|private sector|government|startup|entrepreneur|secteur public|secteur prive|gouvernement|entreprise)\b|트랙|공공|민간|정부|스타트업|창업/i,
      terms: ["track", "public", "private", "sector", "government", "entrepreneur", "gouvernement", "secteur", "트랙", "공공", "민간", "창업"],
    },
    {
      match: /\b(schedule|calendar|when|date|day|august|session|training|timetable|calendrier|horaire|programme|seance|formation)\b|일정|시간표|날짜|연수|교육|세션|시간/i,
      terms: ["schedule", "timetable", "day", "session", "time", "training", "calendrier", "horaire", "programme", "일정", "시간표", "날짜", "연수"],
    },
    {
      match: /\b(visa|passport|travel|korea|ghana|nigeria|senegal|voyage|passeport|sejour|coree)\b|비자|여권|출국|여행|한국|가나|나이지리아|세네갈/i,
      terms: ["visa", "passport", "travel", "ghana", "korea", "voyage", "passeport", "coree", "비자", "여권", "한국", "가나"],
    },
    {
      match: /\b(cost|pay|fee|fund|covered|scholarship|frais|cout|bourse|gratuit|pris en charge)\b|비용|경비|지원금|장학|무료|항공|숙박/i,
      terms: ["cost", "pay", "funded", "covered", "fee", "bourse", "frais", "gratuit", "비용", "경비", "지원금", "장학", "무료"],
    },
    {
      match: /\b(contact|email|help|support|office|courriel|aide|assistance)\b|문의|이메일|연락|도움|사무소/i,
      terms: ["contact", "email", "support", "office", "courriel", "aide", "문의", "이메일", "연락", "도움"],
    },
    {
      match: /\b(phase|online|local|invitational|en ligne|sur place|invitation)\b|단계|온라인|현지|초청/i,
      terms: ["phase", "online", "local", "invitational", "training", "ligne", "초청", "온라인", "현지"],
    },
    {
      match: /\b(alumni|after|community|club|network|anciens|communaute|reseau)\b|동문|네트워크|커뮤니티|수료/i,
      terms: ["alumni", "community", "club", "networking", "reseau", "동문", "네트워크", "커뮤니티"],
    },
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

    const dateMatch = normalizedQuery.match(/\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\b/i);
    if (dateMatch && haystack.includes(dateMatch[0].toLowerCase())) score += 8;

    if ((/\b(apply|application|submit|submission|documents?|form|postuler|candidature|dossier)\b/i.test(normalizedQuery) || /지원|신청|접수|서류/.test(normalizedQuery)) && chunks[index].category === "application") score += 4;
    if ((/\b(eligib|qualif|criteria|age|admissibilit|critere)\b/i.test(normalizedQuery) || /자격|요건|기준|나이|학력|경력/.test(normalizedQuery)) && chunks[index].category === "eligibility") score += 4;
    if ((/\b(track|public sector|private sector|secteur public|secteur prive)\b/i.test(normalizedQuery) || /트랙|공공|민간/.test(normalizedQuery)) && chunks[index].category === "tracks") score += 4;
    if ((/\b(schedule|calendar|when|date|day|session|calendrier|horaire)\b/i.test(normalizedQuery) || /일정|시간표|날짜|세션/.test(normalizedQuery)) && chunks[index].category === "schedule") score += 4;
    if ((/\b(contact|email|support|courriel|aide)\b/i.test(normalizedQuery) || /문의|이메일|연락/.test(normalizedQuery)) && chunks[index].category === "support") score += 4;

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

  const vectorWeight = Math.max(0, Math.min(1, Number(process.env.RAG_VECTOR_WEIGHT ?? 0.65)));
  const lexicalWeight = Math.max(0, Math.min(1, Number(process.env.RAG_LEXICAL_WEIGHT ?? 0.35)));

  const candidates = baseCandidates.map((chunk) => {
    const lexicalScore = lexicalById.get(chunk.id) || 0;
    const vectorScore = queryEmbedding && chunk.embedding ? Math.max(0, cosineSimilarity(queryEmbedding, chunk.embedding)) : 0;
    const score = queryEmbedding ? (vectorScore * vectorWeight) + (lexicalScore * lexicalWeight) : lexicalScore;
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
