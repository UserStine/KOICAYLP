-- KOICA YLP application controls managed from the Admin Portal.

alter table public.application_settings
  add column if not exists close_at timestamptz null,
  add column if not exists public_form_url text null,
  add column if not exists private_form_url text null,
  add column if not exists public_submit_url text null,
  add column if not exists private_submit_url text null;

update public.application_settings
set closed_message = coalesce(nullif(trim(closed_message), ''), 'Applications are currently closed.')
where true;
