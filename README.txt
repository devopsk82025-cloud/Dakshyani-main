Deeksha Consultancy header/profile overlap fix

1. Back up your current GitHub website files.
2. Replace index.html, script.js, and style.css with the files in this folder.
3. Keep admin-login.html if it is already present; this copy is included for completeness.
4. IMPORTANT: Keep your existing supabase-config.js unchanged. It contains your real Supabase project URL and publishable key.
5. Commit and push the updated files to GitHub. Vercel will redeploy automatically.

Fix made:
- Hides the public site navigation header when an authenticated role dashboard opens.
- Restores the public site navigation when the user clicks Back to website or logs out.
- This prevents the long Student / Partner / Company Login header from covering the dashboard user profile area.

No database or SQL changes are required.
