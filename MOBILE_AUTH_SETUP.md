# Mobile authentication deployment

The frontend now uses a same-origin `/api/*` proxy in production. This avoids third-party session cookies, which are commonly blocked by mobile browsers.

## Frontend Vercel project

Set this server-side environment variable:

```env
BACKEND_URL=https://YOUR-BACKEND.vercel.app
```

Do not set `VITE_API_URL` in production. It is only used by local Vite development.

## Backend Vercel project

Keep these values configured:

```env
NODE_ENV=production
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app
YLP_SECRET=YOUR_FIXED_LONG_RANDOM_SECRET
SESSION_TTL_MINUTES=480
```

`YLP_SECRET` must remain stable across deployments.

## Request flow

Browser -> `https://YOUR-FRONTEND.vercel.app/api/login`

Frontend Vercel function -> `https://YOUR-BACKEND.vercel.app/api/login`

The browser receives the HttpOnly session cookie from the frontend origin. Subsequent `/api/me` calls therefore remain first-party on desktop and mobile browsers.
