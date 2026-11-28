# Dakshyani Engineer Dashboard — Milestone-inspired integration

This package updates the existing Deeksha Consultancy portal using the visual style and project-management patterns from the uploaded `milestone` and `taskboard` templates in the `100-free-admin-dashboards` repository.

## Engineer features included
- Admin-assigned projects displayed as responsive project cards.
- Project due dates, status, task totals, and completion percentages.
- Four-column task board: To do, In progress, Checking, Done.
- Engineer task status updates saved to Supabase `engineer_tasks`.
- Project completion graph and task status breakdown based on live Supabase rows.
- Engineer overview keeps skills and GitHub profile/repository links visible.
- Responsive mobile layout.
- Existing Admin, Partner, Company, login, and Supabase portal code retained.

## Files to deploy
Replace these files in the root of your existing GitHub/Vercel website repository:
- `index.html`
- `script.js`
- `style.css`
- `engineer-dashboard-theme.css`

Keep your real existing `supabase-config.js` and do not replace it with the example file. Keep the existing `admin-login.html` and all other project files.

## Supabase
The Engineer project/task integration expects the existing tables and policies:
- `public.engineer_projects`
- `public.engineer_tasks`
- `public.engineer_payments`

If not already applied, run the migrations from `supabase/` as appropriate:
- `engineer_profile_github_fields.sql` adds GitHub profile and repository fields to `freelancer_profiles`.
- `sync_engineer_project_status.sql` synchronizes the parent project status when task rows change.

Do not rerun the base `schema.sql` on an existing production project. Do not expose a Supabase service-role key in browser code.

## Deploy steps
1. Back up the current GitHub repository.
2. Copy the four deploy files above into the root of your existing site repository.
3. Preserve your existing `supabase-config.js` values.
4. Confirm the required SQL migrations are already applied in Supabase.
5. Commit and push to the branch connected to Vercel.
6. Wait for Vercel deployment status `Ready`, then hard-refresh the website.
7. Sign in as an Engineer and test projects, task status changes, and analytics.

## Notes
- `Checking` is the UI label for the existing `blocked` task status value. This preserves the current database status model.
- The project progress percentage is derived from completed tasks for that project. Projects with no tasks show 100% only if the project status is `completed`; otherwise 0%.
- GitHub repository links are entered by the Engineer in My profile & skills; this is not an automatic GitHub API import.
- `template-assets/` retains the selected templates' CSS/JS reference assets and README files. The portal uses a scoped stylesheet so template global CSS does not overwrite the existing public site or other role dashboards.
- The original template license is included at `template-assets/LICENSE`.

## Validation
`node --check script.js` passed. The package has not been deployed or tested against the live Supabase project in this environment.
