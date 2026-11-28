-- Automatic status synchronization for Admin-assigned engineer projects.
-- Run this AFTER the Admin-Engineer workflow migration has succeeded.
-- Does not delete or rewrite existing projects/tasks.

create or replace function public.recalculate_engineer_project_status(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  task_count integer;
  completed_count integer;
  in_progress_count integer;
  blocked_count integer;
  next_status text;
begin
  if p_project_id is null then
    return;
  end if;

  select
    count(*),
    count(*) filter (where status = 'completed'),
    count(*) filter (where status = 'in_progress'),
    count(*) filter (where status = 'blocked')
  into task_count, completed_count, in_progress_count, blocked_count
  from public.engineer_tasks
  where project_id = p_project_id;

  if task_count = 0 then
    next_status := 'assigned';
  elsif completed_count = task_count then
    next_status := 'completed';
  elsif in_progress_count > 0 then
    next_status := 'in_progress';
  elsif blocked_count > 0 then
    next_status := 'on_hold';
  elsif completed_count > 0 then
    next_status := 'in_progress';
  else
    next_status := 'assigned';
  end if;

  update public.engineer_projects
  set status = next_status,
      updated_at = now()
  where id = p_project_id
    and status is distinct from next_status;
end;
$$;

create or replace function public.sync_engineer_project_status_from_tasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_engineer_project_status(old.project_id);
    return old;
  elsif tg_op = 'UPDATE' then
    if old.project_id is distinct from new.project_id then
      perform public.recalculate_engineer_project_status(old.project_id);
    end if;
    perform public.recalculate_engineer_project_status(new.project_id);
    return new;
  else
    perform public.recalculate_engineer_project_status(new.project_id);
    return new;
  end if;
end;
$$;

drop trigger if exists engineer_tasks_sync_project_status on public.engineer_tasks;
create trigger engineer_tasks_sync_project_status
after insert or update of status, project_id or delete
on public.engineer_tasks
for each row
execute function public.sync_engineer_project_status_from_tasks();

-- Prevent direct client calls; the trigger invokes these functions as their owner.
revoke all on function public.recalculate_engineer_project_status(uuid) from public, anon, authenticated;
revoke all on function public.sync_engineer_project_status_from_tasks() from public, anon, authenticated;

-- Recalculate once for projects that already have tasks, so existing dashboards
-- start from consistent task-derived status after this migration is installed.
do $$
declare r record;
begin
  for r in select distinct project_id from public.engineer_tasks where project_id is not null loop
    perform public.recalculate_engineer_project_status(r.project_id);
  end loop;
end;
$$;
