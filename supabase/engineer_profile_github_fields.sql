-- Adds Engineer-owned GitHub profile and project showcase fields.
-- Run once in Supabase SQL Editor. Safe/additive: existing profile data is preserved.
alter table public.freelancer_profiles
  add column if not exists github_url text,
  add column if not exists github_projects jsonb not null default '[]'::jsonb;

comment on column public.freelancer_profiles.github_url is 'Engineer GitHub profile URL';
comment on column public.freelancer_profiles.github_projects is 'Engineer portfolio repository links as a JSON array of {name,url,description}';
