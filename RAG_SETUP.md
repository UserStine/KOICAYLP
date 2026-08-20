# Peko RAG Backend

The chatbot now uses retrieval-augmented generation instead of sending questions directly to the language model.

## Retrieval flow

1. `backend/knowledge/public-knowledge.json` contains curated public KOICA YLP facts.
2. `backend/data/content.json` contributes current announcements, programme modules/timetable entries, and learning-resource metadata.
3. `backend/rag.js` retrieves the most relevant chunks for each user question.
4. If `backend/data/rag-index.json` exists, retrieval uses OpenAI embeddings plus lexical scoring.
5. If no vector index exists, retrieval safely falls back to local lexical scoring.
6. Only retrieved public context is sent to the generation model. Participant records are never included.
7. Responses return source labels (`S1`, `S2`, etc.) and the UI displays those sources.

## Environment

Set these only on the backend:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
RAG_TOP_K=5
RAG_MIN_SCORE=0.08
```

Never expose `OPENAI_API_KEY` through a `VITE_` variable.

## Build the semantic index

From the backend folder, after setting `OPENAI_API_KEY`:

```bash
npm run rag:build
```

This creates:

```text
backend/data/rag-index.json
```

Commit that generated index if you want Vercel/serverless deployments to use semantic retrieval immediately without rebuilding embeddings on cold starts. The index contains embeddings of public programme content, not API keys or participant credentials.

Re-run `npm run rag:build` whenever the public knowledge base or programme content changes substantially.

## Add knowledge

Add approved public facts to:

```text
backend/knowledge/public-knowledge.json
```

Programme modules, announcements, and resource metadata are loaded automatically from `backend/data/content.json`.

Do not add participant records, passwords, PINs, tokens, private application data, or internal administrative notes to the RAG knowledge base.
