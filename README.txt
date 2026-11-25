DEEKSHA CONSULTANCY - FREELANCER DASHBOARD UPGRADE

This package updates the freelancer dashboard inside your existing website. It also adds an Admin > Freelancer rankings page. Partner, Company/Factory and Admin dashboard features are retained.

FILES
- index.html: your existing homepage (unchanged structure; included for a complete replacement set)
- script.js: updated freelancer dashboard, live Supabase analytics, admin ranking management, and dashboard header visibility fix
- style.css: dashboard styling and responsive layout
- admin-login.html: your existing separate admin login page (unchanged)
- supabase/dashboard_upgrade.sql: existing database migration for hourly rates, rank_level and application statuses

INSTALL
1. Download and extract this ZIP.
2. In your GitHub website repository, replace index.html, script.js and style.css with the files from this package.
3. Keep your existing supabase-config.js file. Do not replace it with an example and do not expose a service_role key.
4. Keep admin-login.html. The included copy is supplied for convenience and has not been redesigned.
5. Commit and push to GitHub. Vercel should deploy the changes automatically.

SUPABASE
- The dashboard uses public.freelancer_profiles.rank_level (0-100), applications and jobs already present in your database.
- If you already successfully ran the earlier Deeksha Dashboard Upgrade SQL, do NOT run it again just for this visual update. No new SQL is required for this package if that migration is already applied.
- If you have NOT run the earlier migration, open Supabase > SQL Editor and run supabase/dashboard_upgrade.sql once.
- The existing migration's protect_freelancer_rank trigger prevents a freelancer from changing their own rank. Admins can assign scores through the Admin dashboard.

RANK SCALE
0-39 Beginner
40-59 Bronze
60-79 Silver
80-94 Gold
95-100 Platinum

HOW ADMIN UPDATES A RANK
1. Sign in through admin-login.html.
2. Open Freelancer rankings in the Admin sidebar.
3. Search for a freelancer, enter a whole-number score from 0 to 100, and click Update rank.
4. The freelancer sees the updated rank and score after refreshing/reopening their dashboard.

DATA NOTES
- Dashboard metrics are read from Supabase, not sample numbers.
- Application activity chart counts the user's applications by month over the latest six months.
- Profile strength is calculated from professional title, skills, bio, portfolio URL, experience and hourly rate.
- This package has passed JavaScript syntax validation. It has not been live-tested against your Supabase project or deployed Vercel site. After deployment, test with one approved freelancer account and one admin account.
