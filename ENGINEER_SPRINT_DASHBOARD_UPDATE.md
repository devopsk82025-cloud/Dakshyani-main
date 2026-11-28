# Engineer dashboard — Sprint-inspired update

## Included
- Projects page displays Admin-assigned work as responsive project cards with status, due date, task count and completion percentage.
- Tasks page displays a four-column board: To do, In progress, Checking and Done. Engineers can update only their own task status through the existing Supabase update flow.
- Performance Analytics displays a project-completion graph and task-status breakdown based on the engineer's actual assigned project/task rows.
- Overview displays assigned-project progress, profile skills, GitHub profile and GitHub project links.
- My profile & skills lets the engineer update skills, professional information, GitHub profile and repository links.
- Task updates refresh the project cards and analytics. The existing `sync_engineer_project_status.sql` trigger handles parent project status synchronization.

## Database step required for GitHub fields
Run `supabase/engineer_profile_github_fields.sql` once in Supabase SQL Editor. It only adds `github_url` and `github_projects` to `public.freelancer_profiles`; it does not remove or overwrite existing profile fields.

If the existing task-to-project status trigger migration has not yet been run in this Supabase project, also run `supabase/sync_engineer_project_status.sql` once. Do not run it repeatedly unless you intentionally want to recreate the trigger.

## Deploy
1. Back up the GitHub repository.
2. Replace `script.js` and `style.css` with the files in this package. Keep `index.html`, `admin-login.html`, `supabase-config.js`, images and other existing files.
3. Run the GitHub profile SQL migration above.
4. Commit and push to the same GitHub branch connected to Vercel.
5. Wait for Vercel deployment status `Ready`, then hard-refresh the site (`Ctrl+Shift+R`).
6. Sign in as an Engineer. Check Projects, Tasks, Performance Analytics and Overview.

## Data and permissions
- Projects come from `public.engineer_projects`, filtered by `assigned_engineer_id = auth.uid()`.
- Tasks come from `public.engineer_tasks`, filtered by `assigned_to = auth.uid()`.
- Task status updates use the existing Engineer task-update RLS policy. Admin remains responsible for creating/assigning projects and tasks and setting rank/payment records.
- Skills and GitHub data are stored in `public.freelancer_profiles` for the signed-in Engineer.
- GitHub repository URLs are entered by the Engineer; this update does not automatically import GitHub API data.

## Validation
`node --check script.js` passed when this package was prepared. The package has not been deployed to your Vercel site or tested against your live Supabase project from this environment.
