DEEKSHA CONSULTANCY - ENGINEER DASHBOARD UPGRADE

Package contents
- index.html: updated public labels and engineer registration option; adds a theme switch in the portal sidebar.
- script.js: replaces the old freelancer experience with the engineer workspace and adds company/admin project assignment.
- style.css: responsive dashboard styling for light and dark themes.
- engineer_dashboard_migration.sql: creates project assignment, task and time-tracking tables with RLS.

IMPORTANT COMPATIBILITY NOTE
The Supabase role value remains `freelancer` internally. The portal displays this account type as `Engineer`. This is intentional: the existing profiles trigger, admin ranking, company talent lookup and RLS policies already use the `freelancer` value. Do not rename the database role as part of this upgrade.

INSTALLATION
1. Download and extract this ZIP.
2. In your GitHub repository, make a backup/branch before changing the live files.
3. Replace the repository's index.html, script.js and style.css with the files in this package.
4. Keep your existing supabase-config.js unchanged. Keep admin-login.html unchanged.
5. Open Supabase Dashboard -> SQL Editor -> New query. Paste all of engineer_dashboard_migration.sql and click Run once.
6. Confirm the query returns these four tables: engineer_projects, engineer_project_members, engineer_tasks, engineer_time_entries.
7. Commit and push the three website files to the GitHub branch connected to Vercel. Wait for deployment to finish.
8. Sign in with an already-approved Engineer account (the existing Freelancer account type). Check the Engineer dashboard.

ASSIGN A FIRST PROJECT
1. Sign in as an approved Company/Factory account or Admin.
2. Open `Assign engineers` (Company) or `Engineer projects` (Admin).
3. Find an approved engineer UUID in Supabase SQL Editor using:
   select id, full_name, email, role, account_status
   from public.profiles
   where role = 'freelancer' and account_status = 'approved';
4. Paste the engineer UUID into the form, enter a project title and optionally a first task, then submit.
5. Sign in as that Engineer. The assigned project and task should appear.

SECURITY / OPERATING NOTES
- The Engineer can read only projects assigned to their account, and tasks assigned to them.
- Engineers can change task status, but not task title, assignment, priority or due date.
- Engineers can create and stop their own time entries. A unique index allows only one running timer per engineer.
- Company/Factory project creators and Admins can create projects and assign approved Engineer-role accounts.
- The existing `profiles`, `freelancer_profiles`, `jobs`, `applications`, `is_admin()` and `current_user_role()` structures are not replaced.
- Never put a Supabase service-role key in browser code. Keep only the existing anon/publishable key in supabase-config.js.

CURRENT IMPLEMENTED FEATURES
- Engineer overview metrics, assigned projects, task list/status updates, deadline list, timer start/stop, hours summary, profile, admin-controlled rank, light/dark theme, responsive layout.
- The calendar currently lists task deadlines (not external calendar meetings).
- Timer currently supports start/stop (not pause/resume).
- This package does not yet add chat, file attachments, payment processing, drag-and-drop Kanban, or external calendar sync. Those require additional tables/integrations and are not represented as working features.

ROLLBACK
If anything goes wrong, restore the backed-up index.html, script.js and style.css from GitHub. The SQL migration adds new tables and policies without deleting existing tables or data; do not drop the new tables unless you intentionally want to remove engineer project/task/time records.
