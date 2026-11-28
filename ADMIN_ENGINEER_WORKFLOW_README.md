# Admin-to-Engineer workflow upgrade

## Important compatibility note
The database role remains `freelancer` internally because the existing Supabase schema, auth metadata, policies, applications and profile tables use that value. The user-facing portal label is now **Engineer**. Do not rename the database role to `engineer` unless the entire existing application and every RLS policy are migrated together.

## Included changes
- Admin Portal: Engineer Management section.
- Admin can create and assign projects to approved engineers.
- Admin can create tasks for the engineer assigned to a project.
- Admin can create payment/earnings records and set pending/approved/paid status.
- Existing Engineer Rankings page remains admin-controlled.
- Engineer Portal: Assigned Projects, My Tasks and My Earnings.
- Engineers can read only their own assignments and earnings.
- Engineers may update only the `status` of their own tasks (progress); task title, description, assignment, due date and priority remain admin-controlled.
- Company, Partner and existing account workflows are retained.

## Deployment order
1. Back up your current GitHub/Vercel project and Supabase database.
2. In Supabase SQL Editor, confirm the existing base schema and dashboard upgrade have already been run. The supplied archive includes `supabase/schema.sql` and `supabase/dashboard_upgrade.sql` for reference; do not blindly rerun the base schema on production if you have customized it.
3. Run `supabase/admin_engineer_workflow.sql` in Supabase SQL Editor. It creates the three workflow tables, indexes, triggers, grants and RLS policies.
4. Replace the deployed `index.html`, `script.js`, and `style.css` with the files in this package. Keep your real `supabase-config.js` values; do not replace them with the example file.
5. Commit and push to the GitHub branch connected to Vercel, then wait for deployment.
6. Sign in as an approved admin. Open **Engineer Management**. The engineer dropdown lists only approved accounts whose internal role is `freelancer` (shown as Engineer).
7. Create a project, then assign tasks to that project. Add payment records separately. Set the rank under **Engineer rankings**.
8. Sign in as an approved engineer in a separate browser/incognito session and verify Assigned Projects, My Tasks, My Earnings and My Rank.

## Permission model
- Admin: create/edit projects, tasks, payment records and engineer ranks.
- Engineer: read own projects, tasks, earnings and rank; update only own task progress status.
- Partner and Company: no access to these engineer workflow tables.
- Anonymous users: no access.

## Notes
- This frontend expects the existing Supabase tables/functions from the supplied base schema, including `profiles`, `freelancer_profiles`, `jobs`, `applications`, `public.is_admin()` and `public.current_user_role()`.
- If Supabase reports a missing table/function, stop and share the exact error rather than granting broad permissions.
- Never put a Supabase `service_role` key in browser JavaScript. `supabase-config.js` must contain only the project URL and publishable/anon key.
- This package does not create an admin account or approve any existing account.


## Compatibility fix for existing Supabase tables

This version is adjusted to the database columns inspected on 2026-11-28: `engineer_projects` receives `assigned_engineer_id`; `engineer_tasks` continues using its existing `assigned_to` column. The frontend task insert and engineer task query use `assigned_to`. Run the replacement `supabase/admin_engineer_workflow.sql` once before deploying these updated files. The migration does not drop existing project or task records. Existing projects without an assigned engineer remain unassigned until an admin assigns them.
