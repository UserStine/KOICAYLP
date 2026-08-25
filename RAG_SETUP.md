# Peko Knowledge Base + Gemini Setup

Peko now uses Google Gemini for answer generation and can use Gemini embeddings for semantic retrieval.

## 1. Create a Gemini API key

Create a Gemini API key in Google AI Studio. Keep it server-side only.

Add these values to `backend/.env` locally and to the backend project's Vercel Environment Variables in production:

```env
GEMINI_API_KEY=your_real_server_key
GEMINI_MODEL=gemini-3.7-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_TEMPERATURE=0.3
GEMINI_TOP_P=0.85
GEMINI_MAX_OUTPUT_TOKENS=800
GEMINI_THINKING_LEVEL=low
RAG_TOP_K=6
RAG_MIN_SCORE=0.08
RAG_VECTOR_WEIGHT=0.65
RAG_LEXICAL_WEIGHT=0.35
```

Never add the key to a variable beginning with `VITE_`.

### Tunable Parameters Reference

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_MODEL` | `gemini-3.7-flash` | Gemini model for Peko generation |
| `GEMINI_TEMPERATURE` | `0.3` | Balance between factual grounding (low) and natural phrasing |
| `GEMINI_TOP_P` | `0.85` | Nucleus sampling probability |
| `GEMINI_MAX_OUTPUT_TOKENS` | `800` | Maximum response length tokens |
| `GEMINI_THINKING_LEVEL` | `low` | Reasoning depth (`none`, `low`, `medium`, `high`) |
| `RAG_VECTOR_WEIGHT` | `0.65` | Weight for vector semantic similarity |
| `RAG_LEXICAL_WEIGHT` | `0.35` | Weight for keyword & multilingual lexical scoring |

## 2. Knowledge sources

Peko automatically reads:

- `backend/knowledge/*.json` — curated KOICA YLP facts.
- `backend/data/content.json` announcements.
- `backend/data/content.json` programme modules and timetable.
- `backend/data/content.json` resources.
- The live Supabase `application_settings` record for current open/closed application status.

The main curated file is:

```text
backend/knowledge/public-knowledge.json
```

See `backend/knowledge/README.md` for the chunk format and editing rules.

## 3. Test without an embedding index

Peko works immediately using lexical retrieval. Start the backend:

```bash
cd backend
npm install
npm start
```

Open:

```text
http://localhost:4000/api/ai/health
```

Expected shape:

```json
{
  "ok": true,
  "provider": "gemini",
  "configured": true,
  "knowledgeChunks": 40
}
```

The exact chunk count can be higher because programme modules and announcements are added automatically.

## 4. Build the Gemini embedding index

For better semantic matching, run:

```bash
cd backend
npm run rag:build
```

This creates:

```text
backend/data/rag-index.json
```

The generated index uses `gemini-embedding-001`. Commit the index if you want Vercel deployments to use it without rebuilding on every deployment.

If the index is absent, Peko safely falls back to lexical retrieval.

## 5. Chat API

The frontend Peko widget calls:

```text
POST /api/ai/chat
```

### Request Payload

```json
{
  "message": "What documents do I need to apply?",
  "language": "en",
  "history": [],
  "stream": true
}
```

### SSE Streaming (Default `stream: true` or `Accept: text/event-stream`)

The server emits real-time Server-Sent Events:

1. **Metadata Event**:
```text
event: meta
data: {"sources":[{"ref":"S1","title":"Application documents","category":"application"}],"retrievalMode":"gemini-hybrid-vector","provider":"gemini"}
```

2. **Delta Events** (streamed token chunks):
```text
event: delta
data: {"text":"To apply for the KOICA YLP, you must submit..."}
```

3. **Done Event**:
```text
event: done
data: {"ok":true}
```

### JSON Response (`stream: false`)

```json
{
  "reply": "To apply for the KOICA YLP, you must submit... [S1]",
  "sources": [
    {
      "ref": "S1",
      "title": "Application documents",
      "category": "application"
    }
  ],
  "retrievalMode": "gemini-hybrid-vector",
  "provider": "gemini"
}
```

## 6. Safety behaviour

Peko is instructed to answer only from retrieved KOICA YLP sources. If the knowledge base does not support a claim, it should say that it does not have enough verified information and direct the user to the regional KOICA office or partner university.

Do not put participant records, PINs, passwords, application records, API keys, or other private information in the public knowledge files.

