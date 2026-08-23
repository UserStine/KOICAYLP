-- KOICA YLP participant/auth schema for Supabase.
-- Safe for the initial empty participants table created by 001_supabase_initial.sql.

DO $$
BEGIN
  IF to_regclass('public.participants') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.participants LIMIT 1) THEN
      RAISE EXCEPTION 'participants already contains data. Back it up before running 002_participants_auth.sql.';
    END IF;
    DROP TABLE public.participants;
  END IF;
END $$;

CREATE TABLE public.participants (
  id text PRIMARY KEY,
  name text NOT NULL,
  normalized_name text NOT NULL,
  email text NULL,
  country text NOT NULL DEFAULT '',
  organization text NOT NULL DEFAULT '',
  track text NOT NULL DEFAULT 'public',
  cohort text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'participant',
  pin_salt text NULL,
  pin_hash text NULL,
  password_salt text NULL,
  password_hash text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT participants_role_check CHECK (role IN ('participant', 'admin')),
  CONSTRAINT participants_track_check CHECK (track IN ('public', 'private'))
);

CREATE UNIQUE INDEX participants_normalized_name_unique
  ON public.participants (normalized_name);

CREATE UNIQUE INDEX participants_email_unique
  ON public.participants (lower(email))
  WHERE email IS NOT NULL AND email <> '';

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- No browser/client policies are created intentionally.
-- The Express backend uses the server-side secret key and owns authorization.
