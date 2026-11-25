DEEKSHA CONSULTANCY - FREELANCER DASHBOARD UPDATE
================================================

Files included:
- index.html
- script.js
- style.css
- admin-login.html
- supabase-config.example.js

IMPORTANT:
1. These files update your existing website; they do not rebuild it.
2. Keep your existing supabase-config.js file and its real Project URL + publishable/anon key.
   Do not replace it with the example unless you are creating it for the first time.
3. Never place the Supabase service_role/secret key in website JavaScript.
4. The website uses the existing Supabase tables and fields:
   profiles, freelancer_profiles, jobs, applications.
5. No new SQL migration is required for this Freelancer Dashboard update.
6. Existing freelancer profile fields used:
   professional_title, skills, bio, portfolio_url, experience_years,
   hourly_rate, rate_currency, rank_level.
7. Application status is shown from the applications table. Company/admin is responsible
   for updating selected / in_progress / completed statuses.
8. Earnings/payment totals are intentionally not shown as a freelancer metric because the
   current commissions workflow is for partners and no freelancer payment relationship
   has been confirmed in the current schema.
9. The support email link is a placeholder. Search in script.js for
   support@deekshaconsultancy.com and replace it with your official support email.

Install:
- Replace the matching files in your GitHub repository with these files.
- Keep supabase-config.js in the same folder as index.html.
- Commit and push to GitHub; Vercel should deploy from your connected repository.
- Test using a real approved freelancer account.

Freelancer dashboard includes:
- Overview and project performance cards
- Profile completion indicator
- Suggested projects, with skill overlap shown where available
- Find projects and apply
- My applications and application status
- My projects (selected, in progress, completed)
- Profile and hourly-rate editor
- Admin-assigned rank display
- Application update summary
- Help and support page

No live Supabase/browser deployment test was performed by this package generation.
