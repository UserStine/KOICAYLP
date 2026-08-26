# Peko Chat History — Supabase Setup

Run `backend/sql/007_peko_chat_history.sql` in Supabase SQL Editor.

This creates:

- `peko_conversations` — one row per saved participant chat.
- `peko_messages` — user and assistant messages for each conversation.

Only authenticated participants are persisted. Public/anonymous Peko chats remain browser-session only.

The Express backend owns authorization and uses the server-side Supabase secret key. No browser RLS policies are created.

After applying the SQL, restart the backend and frontend. Signed-in participants will see **History** and **New** controls in Peko.
