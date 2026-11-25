-- Deeksha Consultancy: four-role Supabase database
-- Run in Supabase SQL Editor. Review existing tables before running on production.
-- Roles: freelancer, partner, factory, admin.

create extension if not exists pgcrypto;

-- 1. Core user profile. One row is created automatically for each auth.users account.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  role text not null default 'freelancer',
  account_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text not null default 'freelancer';
alter table public.profiles add column if not exists account_status text not null default 'pending';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('freelancer','partner','factory','admin'));

alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check
  check (account_status in ('pending','approved','suspended'));

create index if not exists profiles_role_idx on public.profiles(role);

-- 2. Role-specific profiles
create table if not exists public.freelancer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  professional_title text,
  skills text[] not null default '{}',
  bio text,
  resume_path text,
  portfolio_url text,
  experience_years numeric(4,1),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  partner_type text not null default 'individual'
    check (partner_type in ('individual','agency')),
  organization_name text,
  website text,
  service_regions text[] not null default '{}',
  specializations text[] not null default '{}',
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  updated_at timestamptz not null default now()
);

create table if not exists public.factory_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  organization_name text not null default '',
  industry text,
  website text,
  location text,
  company_size text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  updated_at timestamptz not null default now()
);

-- 3. Jobs and freelancer applications
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  job_type text not null default 'permanent'
    check (job_type in ('freelance','permanent','temporary','contract')),
  description text not null default '',
  skills text[] not null default '{}',
  location text,
  vacancies integer not null default 1 check (vacancies > 0),
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  status text not null default 'draft'
    check (status in ('draft','published','paused','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_factory_id_idx on public.jobs(factory_id);
create index if not exists jobs_status_idx on public.jobs(status);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  cover_note text,
  resume_path text,
  status text not null default 'submitted'
    check (status in ('submitted','reviewing','shortlisted','interview','selected','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, freelancer_id)
);
create index if not exists applications_freelancer_idx on public.applications(freelancer_id);

-- 4. Workforce requirements submitted by factories
create table if not exists public.manpower_requests (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.profiles(id) on delete cascade,
  facility_name text not null,
  industry text,
  contact_person text not null,
  contact_email text not null,
  contact_phone text,
  roles_required text not null,
  headcount integer not null check (headcount > 0),
  location text not null,
  shift_details text,
  expected_start_date date,
  employment_type text not null default 'temporary'
    check (employment_type in ('permanent','temporary','contract')),
  notes text,
  status text not null default 'submitted'
    check (status in ('submitted','reviewing','sourcing','shortlisted','fulfilled','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Partner referrals and candidate submissions
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  factory_id uuid references public.profiles(id) on delete set null,
  contact_name text not null,
  company_name text,
  contact_email text,
  contact_phone text,
  opportunity_notes text,
  status text not null default 'submitted'
    check (status in ('submitted','contacted','qualified','converted','declined')),
  created_at timestamptz not null default now()
);

create table if not exists public.candidate_submissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  candidate_name text not null,
  candidate_email text,
  candidate_phone text,
  candidate_title text,
  skills text[] not null default '{}',
  experience_years numeric(4,1),
  resume_path text,
  notes text,
  status text not null default 'submitted'
    check (status in ('submitted','reviewing','shortlisted','interview','selected','rejected')),
  created_at timestamptz not null default now()
);

-- 6. Partner commission ledger. Admin controls entries and payment status.
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete set null,
  candidate_submission_id uuid references public.candidate_submissions(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  status text not null default 'pending'
    check (status in ('pending','approved','paid','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- 7. In-app notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

-- 8. Create profile automatically after Supabase Auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'freelancer');
  if requested_role not in ('freelancer','partner','factory') then
    requested_role := 'freelancer';
  end if;

  insert into public.profiles (id, full_name, email, role, account_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    requested_role,
    'pending'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Prevent users from promoting themselves or changing their own approval status.
create or replace function public.protect_profile_role_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() = old.id
     and (new.role is distinct from old.role
          or new.account_status is distinct from old.account_status) then
    raise exception 'You cannot change your own role or account status';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_role_fields_trigger on public.profiles;
create trigger protect_profile_role_fields_trigger
  before update on public.profiles
  for each row execute procedure public.protect_profile_role_fields();

-- 9. Helper function for role checks, avoiding recursive profile policies.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

-- 10. Enable RLS everywhere.
alter table public.profiles enable row level security;
alter table public.freelancer_profiles enable row level security;
alter table public.partner_profiles enable row level security;
alter table public.factory_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.manpower_requests enable row level security;
alter table public.referrals enable row level security;
alter table public.candidate_submissions enable row level security;
alter table public.commissions enable row level security;
alter table public.notifications enable row level security;

-- 11. Policies (drop first so this script can be rerun).
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
for update to authenticated using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "freelancer_profile_read" on public.freelancer_profiles;
create policy "freelancer_profile_read" on public.freelancer_profiles
for select to authenticated using (
  user_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.applications a join public.jobs j on j.id=a.job_id
             where a.freelancer_id=user_id and j.factory_id=auth.uid())
);

drop policy if exists "freelancer_profile_write" on public.freelancer_profiles;
create policy "freelancer_profile_write" on public.freelancer_profiles
for all to authenticated using (user_id=auth.uid() or public.is_admin())
with check (user_id=auth.uid() or public.is_admin());

drop policy if exists "partner_profile_access" on public.partner_profiles;
create policy "partner_profile_access" on public.partner_profiles
for all to authenticated using (user_id=auth.uid() or public.is_admin())
with check (user_id=auth.uid() or public.is_admin());

drop policy if exists "factory_profile_access" on public.factory_profiles;
create policy "factory_profile_access" on public.factory_profiles
for all to authenticated using (user_id=auth.uid() or public.is_admin())
with check (user_id=auth.uid() or public.is_admin());

drop policy if exists "jobs_read_published_or_owner" on public.jobs;
create policy "jobs_read_published_or_owner" on public.jobs
for select to authenticated using (status='published' or factory_id=auth.uid() or public.is_admin());

drop policy if exists "jobs_insert_factory" on public.jobs;
create policy "jobs_insert_factory" on public.jobs
for insert to authenticated with check (
  factory_id=auth.uid() and public.current_user_role()='factory'
);

drop policy if exists "jobs_update_owner_or_admin" on public.jobs;
create policy "jobs_update_owner_or_admin" on public.jobs
for update to authenticated using (factory_id=auth.uid() or public.is_admin())
with check (factory_id=auth.uid() or public.is_admin());

drop policy if exists "jobs_delete_owner_or_admin" on public.jobs;
create policy "jobs_delete_owner_or_admin" on public.jobs
for delete to authenticated using (factory_id=auth.uid() or public.is_admin());

drop policy if exists "applications_read_participant_or_admin" on public.applications;
create policy "applications_read_participant_or_admin" on public.applications
for select to authenticated using (
  freelancer_id=auth.uid() or public.is_admin()
  or exists (select 1 from public.jobs j where j.id=job_id and j.factory_id=auth.uid())
);

drop policy if exists "applications_insert_freelancer" on public.applications;
create policy "applications_insert_freelancer" on public.applications
for insert to authenticated with check (
  freelancer_id=auth.uid() and public.current_user_role()='freelancer'
);

drop policy if exists "applications_update_participant_or_admin" on public.applications;
create policy "applications_update_participant_or_admin" on public.applications
for update to authenticated using (
  freelancer_id=auth.uid() or public.is_admin()
  or exists (select 1 from public.jobs j where j.id=job_id and j.factory_id=auth.uid())
)
with check (
  freelancer_id=auth.uid() or public.is_admin()
  or exists (select 1 from public.jobs j where j.id=job_id and j.factory_id=auth.uid())
);

drop policy if exists "manpower_requests_factory_access" on public.manpower_requests;
create policy "manpower_requests_factory_access" on public.manpower_requests
for all to authenticated using (factory_id=auth.uid() or public.is_admin())
with check (
  (factory_id=auth.uid() and public.current_user_role()='factory')
  or public.is_admin()
);

drop policy if exists "referrals_partner_access" on public.referrals;
create policy "referrals_partner_access" on public.referrals
for all to authenticated using (partner_id=auth.uid() or public.is_admin())
with check (
  (partner_id=auth.uid() and public.current_user_role()='partner')
  or public.is_admin()
);

drop policy if exists "candidate_submissions_partner_access" on public.candidate_submissions;
create policy "candidate_submissions_partner_access" on public.candidate_submissions
for all to authenticated using (partner_id=auth.uid() or public.is_admin())
with check (
  (partner_id=auth.uid() and public.current_user_role()='partner')
  or public.is_admin()
);

drop policy if exists "commissions_read_own_or_admin" on public.commissions;
create policy "commissions_read_own_or_admin" on public.commissions
for select to authenticated using (partner_id=auth.uid() or public.is_admin());

drop policy if exists "commissions_admin_manage" on public.commissions;
create policy "commissions_admin_manage" on public.commissions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notifications_own_or_admin" on public.notifications;
create policy "notifications_own_or_admin" on public.notifications
for all to authenticated using (user_id=auth.uid() or public.is_admin())
with check (user_id=auth.uid() or public.is_admin());

-- 12. Create a private storage bucket for resumes and candidate documents.
insert into storage.buckets (id, name, public)
values ('private-documents', 'private-documents', false)
on conflict (id) do nothing;

drop policy if exists "private_docs_read_owner_or_admin" on storage.objects;
create policy "private_docs_read_owner_or_admin" on storage.objects
for select to authenticated using (
  bucket_id='private-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  or (bucket_id='private-documents' and public.is_admin())
);

drop policy if exists "private_docs_upload_own_folder" on storage.objects;
create policy "private_docs_upload_own_folder" on storage.objects
for insert to authenticated with check (
  bucket_id='private-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "private_docs_update_own_folder" on storage.objects;
create policy "private_docs_update_own_folder" on storage.objects
for update to authenticated using (
  bucket_id='private-documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
)
with check (
  bucket_id='private-documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

-- IMPORTANT: create your first admin only after signing up normally:
-- update public.profiles set role='admin', account_status='approved'
-- where email='YOUR-ADMIN-EMAIL';
-- Never expose the Supabase service_role key in browser JavaScript.
