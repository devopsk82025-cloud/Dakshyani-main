# Engineer dashboard integration update

This update connects the Engineer dashboard's Overview, My Projects and Performance Analytics to the Admin-assigned `engineer_projects` and `engineer_tasks` records.

## What changes
- Overview metrics are based on assigned engineer projects and tasks, not only company job applications.
- My Projects shows Admin-assigned projects and keeps company job applications in a separate subsection.
- Performance Analytics uses project/task completion and task-status counts.
- Updating a task status refreshes the Engineer dashboard data.
- The additive SQL trigger migration recalculates the parent project status when tasks are inserted, updated or deleted.

## Important distinction
- **Available Projects** remains the published company jobs list (`public.jobs`) that engineers can apply for.
- **My Projects / Assigned Projects** shows projects assigned directly by Admin (`public.engineer_projects`).

## Installation
1. Back up the current GitHub repository or download its ZIP.
2. Replace only `script.js` with this package's `script.js`. Keep `index.html`, `style.css`, `admin-login.html`, `supabase-config.js`, and existing assets unchanged.
3. In Supabase SQL Editor, run `supabase/sync_engineer_project_status.sql` once. This is an additive trigger migration; it does not drop existing tables or policies.
4. Commit and push `script.js` to the same GitHub branch connected to Vercel.
5. Wait for Vercel deployment status `Ready` and hard-refresh the website (`Ctrl+Shift+R`).
6. Sign in as an engineer and test a task status change: Assigned -> In progress -> Completed. Check Overview, My Projects and Performance Analytics after each change.

## Expected status logic
- No tasks / all tasks assigned: project = `assigned`
- At least one task in progress: project = `in_progress`
- No task in progress and at least one blocked task: project = `on_hold`
- Some tasks completed while other tasks remain assigned: project = `in_progress`
- All tasks completed: project = `completed`

The trigger runs with a restricted `search_path` and `SECURITY DEFINER` so an engineer's permitted task-status update can update the parent project's derived status without granting the engineer direct project-edit permissions.
