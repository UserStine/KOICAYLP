-- Peko chat history for authenticated KOICA YLP participants.
-- The Express backend uses the server-side Supabase secret key and owns authorization.

create extension if not exists pgcrypto;

create table if not exists public.peko_conversations (
  id uuid primary key default gen_random_uuid(),
  participant_id text not null references public.participants(id) on delete cascade,
  title text not null default 'New conversation',
  language text not null default 'en' check (language in ('en','fr','ko')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists peko_conversations_participant_updated_idx
  on public.peko_conversations (participant_id, updated_at desc);

create table if not exists public.peko_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.peko_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists peko_messages_conversation_created_idx
  on public.peko_messages (conversation_id, created_at asc);

alter table public.peko_conversations enable row level security;
alter table public.peko_messages enable row level security;

-- No browser/client policies are created intentionally. All access goes through Express.
