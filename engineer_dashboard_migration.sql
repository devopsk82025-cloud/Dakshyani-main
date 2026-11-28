-- Deeksha Consultancy: Engineer dashboard tables
-- Run once in Supabase SQL Editor after the existing Deeksha base schema.
-- The existing auth/profile role remains 'freelancer' for compatibility.

create table if not exists public.engineer_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'active' check (status in ('planned','active','on_hold','completed')),
  start_date date,
  due_date date,
  budget_hours numeric(10,2) check (budget_hours is null or budget_hours >= 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.engineer_project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.engineer_projects(id) on delete cascade,
  engineer_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique(project_id, engineer_id)
);

create table if not exists public.engineer_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.engineer_projects(id) on delete cascade,
  assigned_to uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo','in_progress','review','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  due_date date,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.engineer_time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.engineer_projects(id) on delete set null,
  description text not null default 'Work session',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  status text not null default 'running' check (status in ('running','stopped')),
  created_at timestamptz not null default now(),
  constraint engineer_time_end_check check (
    (status = 'running' and ended_at is null) or
    (status = 'stopped' and ended_at is not null)
  )
);

create index if not exists engineer_project_members_engineer_idx on public.engineer_project_members(engineer_id);
create index if not exists engineer_tasks_assignee_due_idx on public.engineer_tasks(assigned_to, due_date);
create index if not exists engineer_tasks_project_idx on public.engineer_tasks(project_id);
create index if not exists engineer_time_user_started_idx on public.engineer_time_entries(user_id, started_at desc);
create unique index if not exists engineer_one_running_timer_per_user
  on public.engineer_time_entries(user_id) where status = 'running';

-- SECURITY DEFINER helpers prevent recursive RLS checks on membership rows.
create or replace function public.is_engineer_project_member(p_project_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.engineer_project_members m
    where m.project_id = p_project_id and m.engineer_id = auth.uid()
  );
$$;

create or replace function public.is_engineer_project_owner(p_project_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.engineer_projects p
    where p.id = p_project_id and p.created_by = auth.uid()
  ) or coalesce(public.is_admin(), false);
$$;

grant execute on function public.is_engineer_project_member(uuid) to authenticated;
grant execute on function public.is_engineer_project_owner(uuid) to authenticated;

alter table public.engineer_projects enable row level security;
alter table public.engineer_project_members enable row level security;
alter table public.engineer_tasks enable row level security;
alter table public.engineer_time_entries enable row level security;

-- Projects: company/factory creates; assigned engineers read; owner/admin manages.
drop policy if exists engineer_projects_read on public.engineer_projects;
create policy engineer_projects_read on public.engineer_projects
for select to authenticated
using (created_by = auth.uid() or public.is_engineer_project_member(id) or public.is_admin());

drop policy if exists engineer_projects_insert on public.engineer_projects;
create policy engineer_projects_insert on public.engineer_projects
for insert to authenticated
with check (created_by = auth.uid() and (public.current_user_role() = 'factory' or public.is_admin()));

drop policy if exists engineer_projects_update on public.engineer_projects;
create policy engineer_projects_update on public.engineer_projects
for update to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists engineer_projects_delete on public.engineer_projects;
create policy engineer_projects_delete on public.engineer_projects
for delete to authenticated
using (created_by = auth.uid() or public.is_admin());

-- Membership: engineers can see their own assignment; project owners/admin assign people.
drop policy if exists engineer_members_read on public.engineer_project_members;
create policy engineer_members_read on public.engineer_project_members
for select to authenticated
using (engineer_id = auth.uid() or public.is_engineer_project_owner(project_id));

drop policy if exists engineer_members_insert on public.engineer_project_members;
create policy engineer_members_insert on public.engineer_project_members
for insert to authenticated
with check (public.is_engineer_project_owner(project_id) and (public.current_user_role() = 'factory' or public.is_admin()) and exists (select 1 from public.profiles p where p.id = engineer_id and p.role = 'freelancer'));

drop policy if exists engineer_members_delete on public.engineer_project_members;
create policy engineer_members_delete on public.engineer_project_members
for delete to authenticated
using (public.is_engineer_project_owner(project_id));

-- Tasks: assigned engineer can read/update status; owner/admin manages task details.
drop policy if exists engineer_tasks_read on public.engineer_tasks;
create policy engineer_tasks_read on public.engineer_tasks
for select to authenticated
using (assigned_to = auth.uid() or public.is_engineer_project_owner(project_id) or public.is_admin());

drop policy if exists engineer_tasks_insert on public.engineer_tasks;
create policy engineer_tasks_insert on public.engineer_tasks
for insert to authenticated
with check (public.is_engineer_project_owner(project_id) and created_by = auth.uid());

drop policy if exists engineer_tasks_update_owner on public.engineer_tasks;
create policy engineer_tasks_update_owner on public.engineer_tasks
for update to authenticated
using (public.is_engineer_project_owner(project_id))
with check (public.is_engineer_project_owner(project_id));

drop policy if exists engineer_tasks_update_assignee on public.engineer_tasks;
create policy engineer_tasks_update_assignee on public.engineer_tasks
for update to authenticated
using (assigned_to = auth.uid() and public.is_engineer_project_member(project_id))
with check (assigned_to = auth.uid() and public.is_engineer_project_member(project_id));

drop policy if exists engineer_tasks_delete on public.engineer_tasks;
create policy engineer_tasks_delete on public.engineer_tasks
for delete to authenticated
using (public.is_engineer_project_owner(project_id));

create or replace function public.protect_engineer_task_fields()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() = old.assigned_to
     and not public.is_engineer_project_owner(old.project_id)
     and not public.is_admin() then
    if new.project_id is distinct from old.project_id
       or new.assigned_to is distinct from old.assigned_to
       or new.title is distinct from old.title
       or new.description is distinct from old.description
       or new.priority is distinct from old.priority
       or new.due_date is distinct from old.due_date
       or new.created_by is distinct from old.created_by then
      raise exception 'Engineers may update task status only';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_engineer_task_fields_trigger on public.engineer_tasks;
create trigger protect_engineer_task_fields_trigger
before update on public.engineer_tasks
for each row execute function public.protect_engineer_task_fields();

-- Time entries: engineers manage their own timer; project owner/admin can review entries.
drop policy if exists engineer_time_read on public.engineer_time_entries;
create policy engineer_time_read on public.engineer_time_entries
for select to authenticated
using (user_id = auth.uid() or (project_id is not null and public.is_engineer_project_owner(project_id)) or public.is_admin());

drop policy if exists engineer_time_insert on public.engineer_time_entries;
create policy engineer_time_insert on public.engineer_time_entries
for insert to authenticated
with check (
  user_id = auth.uid() and
  (project_id is null or public.is_engineer_project_member(project_id))
);

drop policy if exists engineer_time_update on public.engineer_time_entries;
create policy engineer_time_update on public.engineer_time_entries
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists engineer_time_delete on public.engineer_time_entries;
create policy engineer_time_delete on public.engineer_time_entries
for delete to authenticated
using (user_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.engineer_projects to authenticated;
grant select, insert, update, delete on public.engineer_project_members to authenticated;
grant select, insert, update, delete on public.engineer_tasks to authenticated;
grant select, insert, update, delete on public.engineer_time_entries to authenticated;

-- Verification: expected four new tables.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('engineer_projects','engineer_project_members','engineer_tasks','engineer_time_entries')
order by table_name;
