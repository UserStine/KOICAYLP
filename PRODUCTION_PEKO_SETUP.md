# Peko production setup

Peko uses two Vercel projects in the current architecture: the frontend and backend.

## Frontend project environment

Set:

```env
BACKEND_URL=https://YOUR-BACKEND-DOMAIN
```

Do not set the backend Gemini secret in the frontend project.

## Backend project environment

Set at minimum:

```env
NODE_ENV=production
FRONTEND_URL=https://YOUR-FRONTEND-DOMAIN
YLP_SECRET=YOUR_LONG_RANDOM_SECRET
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
GEMINI_API_KEY=YOUR_VALID_GEMINI_KEY
GEMINI_MODEL=gemini-3.6-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
RAG_TOP_K=6
RAG_MIN_SCORE=0.08
```

Apply the variables to Production and redeploy both projects after changing them.

## Production checks

Open this through the deployed frontend:

```text
https://YOUR-FRONTEND-DOMAIN/api/ai/health
```

Expected fields include:

```json
{
  "ok": true,
  "provider": "gemini",
  "configured": true,
  "knowledgeSource": "supabase",
  "streaming": true
}
```

If `configured` is false, `GEMINI_API_KEY` is missing from the backend deployment.
If the route returns 502 from `api-proxy`, verify `BACKEND_URL` on the frontend project.
If health works but chat fails, inspect the backend function log for `gemini_stream_upstream_error` or `gemini_upstream_error`.
