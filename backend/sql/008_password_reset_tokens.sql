-- Peko / Participant Portal password recovery tokens.
-- Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  participant_id text not null references public.participants(id) on delete cascade,
  token_digest text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_participant_idx
  on public.password_reset_tokens (participant_id, created_at desc);

create index if not exists password_reset_tokens_expiry_idx
  on public.password_reset_tokens (expires_at);

alter table public.password_reset_tokens enable row level security;

-- No browser policies are intentionally created. Password-reset tokens are
-- server-only records accessed through SUPABASE_SERVICE_ROLE_KEY.
