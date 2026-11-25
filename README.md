# Deeksha Consultancy — role-based portal update

## Included
- `index.html`, `style.css`, `script.js`: updated existing public site and shared role dashboards.
- `admin-login.html`: separate administrator sign-in page (`/admin-login.html`).
- `supabase-config.js`: browser-safe Supabase configuration placeholders. Keep your real existing values when deploying.
- `supabase/dashboard_upgrade.sql`: one-time migration for rank, rates, project status tracking and company freelancer-directory access.
- `supabase/schema.sql`: original base schema supplied with the project; do not rerun it if already applied.

## Account roles
- Student uses the existing `freelancer` role.
- Partner / Recruitment Agency uses `partner`.
- Company uses `factory`.
- Admin uses `admin` and signs in only at `admin-login.html`.

## Dashboard features
- Freelancer: completed and active project counts from applications, admin-assigned rank, editable hourly rate, profile, published projects and applications.
- Partner / Agency: suggested published opportunities, referral and candidate counts, and commission records.
- Company: publish jobs/projects, manage manpower requests, view suggested freelancer profiles, and mark applications In progress or Completed.
- Admin: approve accounts, review jobs/referrals/manpower requests, and assign freelancer rank from 0 to 100.

## Deployment sequence
1. Back up the GitHub repository currently connected to Vercel.
2. In Supabase SQL Editor, run `supabase/dashboard_upgrade.sql` once. The base schema and the earlier `profiles` permission fix should already be applied.
3. Copy the contents of this `deeksha_work` folder into the root of the GitHub website repository. Keep the existing `supabase-config.js` values; do not replace them with placeholders.
4. Commit and push to GitHub; wait for Vercel deployment.
5. Visit `/admin-login.html` for Admin. Other roles use the homepage Login button and select the matching account type.
6. Test with separate approved test accounts. New registrations remain pending until an Admin approves them.

Never put a Supabase `service_role` or secret key in browser files. Only the Project URL and Publishable/anon key belong in `supabase-config.js`.

## Notes
- Project counts reflect actual application rows. A company can update an application to `in_progress` or `completed` from its Project applications section.
- Rank is controlled by Admin; freelancers can edit their rate and profile but cannot change their own rank.
- Suggested partner opportunities come from published jobs. Suggested company talent comes from freelancer profiles already created in the portal.
- This is a frontend/database integration starter. Before production, test all RLS policies with separate accounts and add any business-specific matching, commission calculation, candidate-consent and privacy workflows your agency requires.
