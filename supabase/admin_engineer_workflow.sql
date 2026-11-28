-- Compatibility migration for the EXISTING engineer tables reported by the user.
-- Existing schema: engineer_projects has no assigned_engineer_id;
-- engineer_tasks uses assigned_to (NOT engineer_id).
-- Run this entire script once in Supabase SQL Editor.

-- 1) Add the project-to-engineer assignment column without dropping existing data.
alter table public.engineer_projects
  add column if not exists assigned_engineer_id uuid;

-- Add the FK only if it is not already present.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'engineer_projects_assigned_engineer_id_fkey'
      and conrelid = 'public.engineer_projects'::regclass
  ) then
    alter table public.engineer_projects
      add constraint engineer_projects_assigned_engineer_id_fkey
      foreign key (assigned_engineer_id) references public.profiles(id) on delete restrict;
  end if;
end $$;

-- Recover an existing single-engineer project assignment from its tasks where unambiguous.
-- Projects with tasks assigned to multiple engineers are deliberately left unassigned.
with one_engineer_per_project as (
  select project_id, min(assigned_to::text)::uuid as engineer_id
  from public.engineer_tasks
  where assigned_to is not null
  group by project_id
  having count(distinct assigned_to) = 1
)
update public.engineer_projects ep
set assigned_engineer_id = x.engineer_id
from one_engineer_per_project x
where ep.id = x.project_id and ep.assigned_engineer_id is null;

create index if not exists engineer_projects_assignee_idx
  on public.engineer_projects(assigned_engineer_id, created_at desc);
create index if not exists engineer_tasks_assignee_idx
  on public.engineer_tasks(assigned_to, created_at desc);
create index if not exists engineer_tasks_project_idx
  on public.engineer_tasks(project_id);

-- 2) Payment records. This table was not present in the user's column report.
create table if not exists public.engineer_payments (
  id uuid primary key default gen_random_uuid(),
  engineer_id uuid not null references public.profiles(id) on delete restrict,
  project_id uuid references public.engineer_projects(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'INR' check (currency in ('INR','USD')),
  status text not null default 'pending' check (status in ('pending','approved','paid','cancelled')),
  notes text not null default '',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists engineer_payments_engineer_idx
  on public.engineer_payments(engineer_id, created_at desc);

-- 3) Database-side validation: only admins may create/assign projects.
create or replace function public.validate_engineer_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can create or assign engineer projects';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = new.assigned_engineer_id
      and p.role = 'freelancer'
      and p.account_status = 'approved'
  ) then
    raise exception 'Select an approved engineer account';
  end if;
  return new;
end; $$;
drop trigger if exists engineer_project_admin_insert on public.engineer_projects;
create trigger engineer_project_admin_insert
before insert or update of assigned_engineer_id on public.engineer_projects
for each row execute function public.validate_engineer_assignment();

-- 4) Only admins may create/edit tasks. Task engineer must match project engineer.
create or replace function public.validate_engineer_task_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare project_engineer uuid;
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      raise exception 'Only administrators can create tasks';
    end if;
    return new;
  end if;
  select assigned_engineer_id into project_engineer
  from public.engineer_projects where id = new.project_id;
  if project_engineer is null or project_engineer <> new.assigned_to then
    raise exception 'Task engineer must match the project assignee';
  end if;
  return new;
end; $$;
drop trigger if exists engineer_task_admin_write on public.engineer_tasks;
create trigger engineer_task_admin_write
before insert or update on public.engineer_tasks
for each row execute function public.validate_engineer_task_write();

-- Engineers can update only the status field of their own tasks.
create or replace function public.protect_engineer_task_progress()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if auth.uid() is distinct from old.assigned_to then
      raise exception 'You can update only your own tasks';
    end if;
    if (to_jsonb(new) - 'status' - 'updated_at') is distinct from
       (to_jsonb(old) - 'status' - 'updated_at') then
      raise exception 'Engineers may update task progress only';
    end if;
    new.updated_at := now();
  end if;
  return new;
end; $$;
drop trigger if exists engineer_task_progress_guard on public.engineer_tasks;
create trigger engineer_task_progress_guard
before update on public.engineer_tasks
for each row execute function public.protect_engineer_task_progress();

-- 5) Payments are admin-managed only; engineers can read their own records.
create or replace function public.validate_engineer_payment_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can create or edit payment records';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = new.engineer_id and p.role = 'freelancer'
  ) then
    raise exception 'Payment recipient must be an engineer';
  end if;
  if new.project_id is not null and not exists (
    select 1 from public.engineer_projects ep
    where ep.id = new.project_id and ep.assigned_engineer_id = new.engineer_id
  ) then
    raise exception 'Payment project must belong to the selected engineer';
  end if;
  return new;
end; $$;
drop trigger if exists engineer_payment_admin_write on public.engineer_payments;
create trigger engineer_payment_admin_write
before insert or update on public.engineer_payments
for each row execute function public.validate_engineer_payment_write();

-- 6) RLS: admins manage all; engineers read their own projects/tasks/payments.
-- Remove older policies on these workflow tables so a permissive legacy policy
-- cannot accidentally broaden access (Postgres combines permissive policies with OR).
do $$
declare pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('engineer_projects','engineer_tasks','engineer_payments')
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

alter table public.engineer_projects enable row level security;
alter table public.engineer_tasks enable row level security;
alter table public.engineer_payments enable row level security;

drop policy if exists engineer_projects_admin_all on public.engineer_projects;
drop policy if exists engineer_projects_engineer_read on public.engineer_projects;
create policy engineer_projects_admin_all on public.engineer_projects
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy engineer_projects_engineer_read on public.engineer_projects
for select to authenticated using (assigned_engineer_id = auth.uid());

drop policy if exists engineer_tasks_admin_all on public.engineer_tasks;
drop policy if exists engineer_tasks_engineer_read on public.engineer_tasks;
drop policy if exists engineer_tasks_engineer_progress on public.engineer_tasks;
create policy engineer_tasks_admin_all on public.engineer_tasks
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy engineer_tasks_engineer_read on public.engineer_tasks
for select to authenticated using (assigned_to = auth.uid());
create policy engineer_tasks_engineer_progress on public.engineer_tasks
for update to authenticated using (assigned_to = auth.uid()) with check (assigned_to = auth.uid());

drop policy if exists engineer_payments_admin_all on public.engineer_payments;
drop policy if exists engineer_payments_engineer_read on public.engineer_payments;
create policy engineer_payments_admin_all on public.engineer_payments
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy engineer_payments_engineer_read on public.engineer_payments
for select to authenticated using (engineer_id = auth.uid());

-- 7) Grants: RLS remains the actual access control.
grant select, insert, update, delete on public.engineer_projects to authenticated;
grant select, insert, update, delete on public.engineer_tasks to authenticated;
grant select, insert, update, delete on public.engineer_payments to authenticated;
revoke all on public.engineer_projects from anon;
revoke all on public.engineer_tasks from anon;
revoke all on public.engineer_payments from anon;
