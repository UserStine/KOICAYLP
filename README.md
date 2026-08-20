# KOICA YLP — separated frontend and backend

The original single project has been split into two independently deployable applications.

## Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default local URL: `http://localhost:5173`

Set `VITE_API_URL` to the public backend URL when deploying the frontend, for example:

```env
VITE_API_URL=https://api.example.com
```

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm start
```

Default local URL: `http://localhost:4000`

Set `FRONTEND_URL` to the frontend origin. Multiple origins can be comma-separated:

```env
FRONTEND_URL=https://lms.example.com,https://www.lms.example.com
```

Set a permanent `YLP_SECRET` in production. If it changes, existing login tokens become invalid.

## Existing storage

The separation intentionally keeps the current storage model:

- `backend/data/content.json`
- `backend/data/participants.json`
- `backend/data/progress.json`
- `backend/data/roster.csv`
- `backend/uploads/resources/`
- `backend/uploads/module-presentations/`

A host must provide persistent storage for `backend/data/` and `backend/uploads/`, otherwise changes and uploaded files may disappear after a redeploy/restart.

## Roster import

From the backend folder:

```bash
npm run import-roster -- data/roster.csv
```
