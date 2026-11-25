# Deeksha Consultancy — Supabase upgrade package

## What is included

- `index.html`, `style.css`, `script.js`: the exact existing website prototype, preserved.
- `supabase/schema.sql`: proposed four-role database schema and initial RLS policies.

## Current source audit

The uploaded website is plain HTML, CSS and JavaScript. Its README says the forms and demo dashboard data use browser `localStorage`. The current page has freelancer and company dashboards, and a company-side manpower request form. It does not currently include a Supabase SDK/client, password authentication, partner dashboard, or admin dashboard.

This package does not pretend those features are already connected. The SQL is the database foundation for the next frontend integration stage.

## Roles

- `freelancer`: applies for freelance, permanent, temporary or contract opportunities.
- `partner`: individual referral partner or recruitment agency; submits referrals and candidate profiles.
- `factory`: company/factory account; posts vacancies and manpower requests.
- `admin`: agency administrator; reviews accounts, jobs, submissions, requests and commission records.

New accounts are `pending` by default. Admin approval should be part of the launch workflow.

## Step 1 — Check the existing Supabase project before running SQL

You previously encountered `ERROR: relation "public.profiles" does not exist`. That means the earlier SQL which referenced `profiles` ran before the table existed, or the table was not created in the schema being queried.

In Supabase Dashboard → SQL Editor, run this read-only check first:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles','freelancer_profiles','partner_profiles','factory_profiles',
    'jobs','applications','manpower_requests','referrals',
    'candidate_submissions','commissions','notifications'
  )
order by table_name;
```

Save the result. If this is a production database with real user data, take a backup before applying schema changes.

## Step 2 — Apply the schema

Open `supabase/schema.sql`, copy all of it into Supabase SQL Editor, and run it. Review the result for errors. If an error appears, stop and share the exact error text; do not keep running later sections blindly.

The script is designed to create missing tables and replace the named policies/triggers. It updates the `profiles.role` constraint to the four roles. If your current database has custom columns, policies, or triggers, review those before applying.

## Step 3 — Create the first administrator

1. Register your own account through Supabase Auth after the frontend signup flow is connected (or create the account in Authentication → Users).
2. In SQL Editor, replace the email below with your exact admin email and run:

```sql
update public.profiles
set role = 'admin', account_status = 'approved'
where email = 'YOUR-ADMIN-EMAIL';
```

Do not allow public signup to select the `admin` role. The signup trigger only accepts `freelancer`, `partner`, or `factory`.

## Step 4 — Frontend connection (next integration stage)

The frontend must load Supabase JS v2 and initialize a client using:
- Project URL
- Publishable/anon key

These are browser-safe values when Row Level Security is enabled and policies are correct. Never put the `service_role` key in HTML or JavaScript.

The next frontend change should:
1. Replace the demo auth modal with sign-up, sign-in and password reset.
2. Read the signed-in user's `profiles.role` and `account_status`.
3. Route to the correct dashboard (`freelancer`, `partner`, `factory`, `admin`).
4. Replace all `localStorage` writes with Supabase table operations.
5. Add private Storage uploads for resumes and candidate documents.
6. Add admin approval, audit-friendly status changes and commission management.

## Step 5 — Vercel

Your existing project is deployed through GitHub and Vercel. Keep the existing static deployment. Add the Supabase project URL and publishable/anon key to the frontend configuration (or Vercel environment variables if you use a build step), commit the updated files to GitHub, and redeploy.

## Security and launch checklist

- Enable email confirmation and configure the correct Site URL and redirect URLs in Supabase Auth.
- Keep RLS enabled on every user-data table.
- Never expose service_role keys.
- Keep resumes and candidate documents in a private Storage bucket.
- Add privacy/consent wording before collecting candidate data.
- Confirm applicable employment, data-protection and recruiting requirements for the countries where the agency operates.
- Test with separate freelancer, partner, factory and admin accounts before launch.

## Important note about the SQL

This is a foundational schema, not a complete production recruitment product. Before launch, test every policy using separate test accounts. In particular, the agency's commercial rules for partner commission calculation, referral ownership, candidate consent and factory visibility must be agreed and implemented explicitly.
