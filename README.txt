DIGITAL WORLD — WEBSITE + MARKETING OS FOUNDATION (UPDATED FOR CURRENT SUPABASE PROJECT)
============================================================================================

This update preserves the existing Digital World static website and its visual assets. It aligns the sign-in/workspace code with the tables already created in the Supabase project:
profiles, businesses, portfolios, digital_cards, review_drafts, analytics_events, audit_logs.

IMPORTANT: This is a foundation, not yet a fully integrated commercial marketing SaaS. Google Business Profile live data, Meta publishing, actual AI generation, scheduled posting, billing, media uploads, and full SEO/competitor analysis need separate implementation and approved provider APIs. Do not describe those as active until tested.

A. CONFIGURE THE PUBLIC SUPABASE KEY
------------------------------------
js/supabase-config.js already contains the project URL:
https://rrewnwdcsglvoknihlok.supabase.co

Replace PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE with the project's public publishable key from Supabase -> Project Settings / API Keys.
A public publishable/anon key is intended for browser code. NEVER put a service_role key, database password, Google Client Secret, or any other private secret in this file or GitHub.

B. APPLY THE SECURITY / ADMIN MIGRATION
---------------------------------------
In Supabase -> SQL Editor, open supabase/admin-migration.sql, review it, and run it against the NEW project digital-world-marketing.

It adds admin policies for the existing businesses, portfolios, digital_cards, review_drafts and analytics_events tables. It also closes an important privilege escalation in the initial profile update policy so authenticated users cannot change their own role/approval_status.

Run this before using the dashboard. After running it, verify in Table Editor that the SQL succeeded.

C. AUTHENTICATION
-----------------
Supabase -> Authentication:
- Google provider must be enabled with the Google OAuth Client ID and Client Secret entered only in Supabase.
- Email provider may remain enabled.
- In Google Cloud OAuth client, Authorized redirect URI must be exactly:
  https://rrewnwdcsglvoknihlok.supabase.co/auth/v1/callback
- Google OAuth Audience is currently in Testing mode. Add your own Gmail as a test user. To allow all customers later, review Google's publishing/verification requirements.

D. ADMIN ACCOUNT
----------------
The owner's profile should already exist with role=super_admin and approval_status=approved. The site checks the signed-in user's row in public.profiles where id equals the Supabase Auth user UUID.
If the workspace shows access denied, verify that row in Supabase Table Editor. Do not grant super_admin to customers.

E. CONFIGURE LIVE HOSTING (NO LOCALHOST REQUIRED)
-------------------------------------------------
Upload/commit the contents of this folder to the ROOT of the existing GitHub repository. Preserve the existing CNAME and website pages. Then deploy the repository through Vercel (static site; no build command needed, output/root directory is the repository root).
After Vercel gives the production URL:
1. Supabase -> Authentication -> URL Configuration:
   - Site URL = the exact live website origin (for example https://your-site.vercel.app or your connected custom domain).
   - Add the exact live origin and https://your-live-domain/** to Redirect URLs. Also allow the sign-in redirect destination https://your-live-domain/app/dashboard.html.
2. Google Cloud -> Google Auth Platform -> Clients -> your Web client:
   - Authorized JavaScript origins: the exact live website origin.
   - Authorized redirect URIs: keep the Supabase callback URL above. Do not use the website's dashboard URL as the Google OAuth callback.
3. Test Google sign-in on the live site.

F. PAGES / FEATURES IN THIS PACKAGE
-----------------------------------
- Original Digital World website pages and assets are retained.
- Sign In page: app/sign-in.html (Google OAuth and email/password).
- Workspace: app/dashboard.html (super-admin business creation, publish/unpublish, delete, basic event counts, review-draft helper).
- Public portfolio: portfolio-view.html?slug=business-slug. Only published businesses are publicly queryable.
- Business creation also creates linked portfolio and digital-card rows. Publishing toggles the linked records.
- Basic page/portfolio events are stored in analytics_events. Counts are events, not guaranteed unique human visitors.
- Review drafts are templates based on notes, not AI-generated. The user must verify and manually submit honest content.

G. SECURITY / LIMITATIONS
-------------------------
- RLS is the security boundary. Test with a non-admin user before public launch.
- Public portfolio pages show only published business/portfolio/card data, subject to RLS.
- This update does not activate Google Business Profile data, Meta publishing, or an AI API.
- Basic analytics stores page path, referrer, session ID and device type. Add an appropriate privacy notice and any required consent before production use.
- Do not expose OAuth Client Secret in screenshots, GitHub, browser code, or chat. A secret visible in a screenshot should be rotated.
