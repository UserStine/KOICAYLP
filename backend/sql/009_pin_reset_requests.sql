-- Admin-assisted KOICA PIN recovery
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

alter table public.participants
  add column if not exists must_change_pin boolean not null default false;

create table if not exists public.pin_reset_requests (
  id uuid primary key default gen_random_uuid(),
  participant_id text not null references public.participants(id) on delete cascade,
  participant_name text not null,
  country text not null default '',
  track text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  note text not null default '',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text references public.participants(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists pin_reset_requests_status_idx
  on public.pin_reset_requests (status, requested_at desc);

create index if not exists pin_reset_requests_participant_idx
  on public.pin_reset_requests (participant_id, requested_at desc);

create unique index if not exists pin_reset_requests_one_pending_idx
  on public.pin_reset_requests (participant_id)
  where status = 'pending';

alter table public.pin_reset_requests enable row level security;
-- No public RLS policies are created. The backend uses the service-role key.
