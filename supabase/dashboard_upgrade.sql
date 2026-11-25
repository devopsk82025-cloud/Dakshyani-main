-- Deeksha Consultancy dashboard enhancement migration
-- Run once in Supabase SQL Editor AFTER the existing base schema.
-- Keeps RLS enabled. Does not create or promote any admin account.

-- 1) Freelancer pricing and admin-assigned rank.
alter table public.freelancer_profiles
  add column if not exists hourly_rate numeric(12,2),
  add column if not exists rate_currency text not null default 'INR',
  add column if not exists rank_level integer not null default 0;

alter table public.freelancer_profiles
  drop constraint if exists freelancer_profiles_rate_currency_check;
alter table public.freelancer_profiles
  add constraint freelancer_profiles_rate_currency_check
  check (rate_currency in ('INR','USD'));

alter table public.freelancer_profiles
  drop constraint if exists freelancer_profiles_hourly_rate_check;
alter table public.freelancer_profiles
  add constraint freelancer_profiles_hourly_rate_check
  check (hourly_rate is null or hourly_rate >= 0);

alter table public.freelancer_profiles
  drop constraint if exists freelancer_profiles_rank_level_check;
alter table public.freelancer_profiles
  add constraint freelancer_profiles_rank_level_check
  check (rank_level between 0 and 100);

-- Freelancers can set their own rate/profile, but cannot assign their own rank.
create or replace function public.protect_freelancer_rank()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = new.user_id and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.rank_level := 0;
    elsif new.rank_level is distinct from old.rank_level then
      new.rank_level := old.rank_level;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_freelancer_rank_trigger on public.freelancer_profiles;
create trigger protect_freelancer_rank_trigger
before insert or update on public.freelancer_profiles
for each row execute function public.protect_freelancer_rank();

-- 2) Track completion explicitly so the dashboard does not guess based on selection.
alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
check (status in ('submitted','reviewing','shortlisted','interview','selected','in_progress','completed','rejected','withdrawn'));

-- A freelancer cannot mark their own application completed or change its status.
-- The factory that owns the job and the admin can update application status.
create or replace function public.protect_application_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.freelancer_id
     and not public.is_admin()
     and new.status is distinct from old.status then
    raise exception 'Only the hiring company or administrator can update application status';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_application_status_trigger on public.applications;
create trigger protect_application_status_trigger
before update on public.applications
for each row execute function public.protect_application_status();

-- 3) Let approved factory/company accounts discover freelancer profiles.
-- Only request the name/role columns needed for the directory in frontend code.
drop policy if exists "profiles_factory_read_freelancers" on public.profiles;
create policy "profiles_factory_read_freelancers" on public.profiles
for select to authenticated
using (role = 'freelancer' and public.current_user_role() = 'factory');

drop policy if exists "freelancer_profile_factory_directory" on public.freelancer_profiles;
create policy "freelancer_profile_factory_directory" on public.freelancer_profiles
for select to authenticated
using (public.current_user_role() = 'factory');

-- Existing RLS policies remain enabled. No anon access is granted.
