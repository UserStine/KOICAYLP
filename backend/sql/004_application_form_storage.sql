-- KOICA YLP application form uploads stored in Supabase Storage.
-- Run once in Supabase SQL Editor.

alter table public.application_settings
  add column if not exists public_form_path text null,
  add column if not exists public_form_name text null,
  add column if not exists public_form_mime text null,
  add column if not exists private_form_path text null,
  add column if not exists private_form_name text null,
  add column if not exists private_form_mime text null;

-- Keep the bucket private. The Express backend serves downloads only while
-- applications are open, using the server-side Supabase secret key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-forms',
  'application-forms',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
