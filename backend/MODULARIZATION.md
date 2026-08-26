# Backend modularization

The backend now boots through `server.js` -> `app.js`. New domain modules live under `src/` and own the public application flow, authentication, LMS core routes, Gemini/RAG routes, security, repositories and tests.

## Compatibility guarantee

Existing endpoint paths, cookies and response shapes are preserved. `legacy-app.js` is a temporary compatibility bridge for older admin/content handlers that have not yet been extracted one-for-one. It does not open a port; only `server.js` listens. This allows incremental extraction without breaking the React frontend.

## Repository strategy

- Participants: Supabase when configured, JSON fallback otherwise.
- Knowledge: Supabase when configured, seed/local fallback otherwise.
- Content and progress: repository wrappers around JSON storage, ready for a Supabase adapter later.
- Applications: Supabase remains the production source because submissions and private form assets rely on Supabase Storage; the repository boundary isolates this from route code.

## Tests

Run after installing dependencies:

```bash
npm install
npm test
```

Tests cover authentication crypto/session behavior, multilingual lexical RAG ranking, and API health/route integration.
