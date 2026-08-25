-- Peko / Gemini knowledge base
create extension if not exists pgcrypto;

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'program',
  content text not null,
  language text not null default 'en' check (language in ('en','fr','ko','all')),
  source text not null default 'KOICA YLP knowledge base',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_articles_published_idx
  on public.knowledge_articles (is_published, updated_at desc);
create index if not exists knowledge_articles_category_idx
  on public.knowledge_articles (category);
create index if not exists knowledge_articles_language_idx
  on public.knowledge_articles (language);

alter table public.knowledge_articles enable row level security;

-- No browser policies are created intentionally. The service-role backend is the
-- only component that reads/writes this table; admin access is enforced by Express.
