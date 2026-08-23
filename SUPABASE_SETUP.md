# Supabase setup

The project now reads the public application open/closed state from Supabase while keeping the existing Express API contract.

1. In Supabase, open **SQL Editor** and run `backend/sql/001_supabase_initial.sql`.
2. In `backend/.env`, add your server-only values:

   ```env
   SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
   ```

3. From `backend`, install dependencies:

   ```bash
   npm install
   ```

4. Start the API:

   ```bash
   npm start
   ```

5. Test:

   ```text
   http://localhost:4000/api/application-status
   ```

Expected response while closed:

```json
{
  "open": false,
  "message": "Applications are currently closed.",
  "source": "supabase"
}
```

The `forms` and `submissions` properties are still populated from backend environment variables, so existing Apply-page download and submit links keep working when applications are opened.

## Security

Keep `SUPABASE_SERVICE_ROLE_KEY` only in the backend environment. Never add it to `frontend/.env`, never prefix it with `VITE_`, and never commit the real value to Git.

## Participant/login migration

The application-status table is already connected. The next migration moves participant authentication from `backend/data/participants.json` to Supabase.

1. Open Supabase **SQL Editor** and run `backend/sql/002_participants_auth.sql`.
   - The script replaces the original empty starter `participants` table with the text-ID/auth schema used by KOICA YLP.
   - It deliberately stops if the existing table already contains rows.

2. Keep your real `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.

3. From the `backend` directory run:

```bash
npm install
npm run supabase:migrate-participants
```

The migration refuses to import any record containing a plaintext `pin` field. It imports the existing salted PIN hashes/password hashes only.

4. Start the API:

```bash
npm start
```

5. Test an existing KOICA participant login. Login, session account lookup, registration, password reset participant lookup, and the admin participant list now read participants from Supabase.

Do not delete `backend/data/participants.json` until you have verified the imported row count and tested at least one participant and one admin login. The JSON file is retained only as a migration/rollback source during this stage.
