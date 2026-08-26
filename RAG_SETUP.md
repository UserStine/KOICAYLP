# Peko Knowledge Base + Gemini Setup

Peko now uses Google Gemini for answer generation and can use Gemini embeddings for semantic retrieval.

## 1. Create a Gemini API key

Create a Gemini API key in Google AI Studio. Keep it server-side only.

Add these values to `backend/.env` locally and to the backend project's Vercel Environment Variables in production:

```env
GEMINI_API_KEY=your_real_server_key
GEMINI_MODEL=gemini-3.7-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
RAG_TOP_K=6
RAG_MIN_SCORE=0.08
```

Never add the key to a variable beginning with `VITE_`.

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

The frontend Peko widget now calls:

```text
POST /api/ai/chat
```

Example request:

```json
{
  "message": "What documents do I need to apply?",
  "language": "en",
  "history": []
}
```

The API returns the Gemini answer plus the KOICA source chunks used:

```json
{
  "reply": "... [S1]",
  "sources": [
    {
      "ref": "S1",
      "title": "Application documents",
      "category": "application"
    }
  ],
  "provider": "gemini"
}
```

## 6. Safety behaviour

Peko is instructed to answer only from retrieved KOICA YLP sources. If the knowledge base does not support a claim, it should say that it does not have enough verified information and direct the user to the regional KOICA office or partner university.

Do not put participant records, PINs, passwords, application records, API keys, or other private information in the public knowledge files.
