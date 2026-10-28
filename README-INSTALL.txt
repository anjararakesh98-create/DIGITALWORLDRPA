DIGITAL WORLD MARKETING OS — INTEGRATION UPDATE

This update aligns the Supabase setup with the current GitHub files and the verified profile table:
public.profiles (id, full_name, email, role, approval_status, created_at, updated_at).
It does NOT use public.user_profiles and does not drop existing tables or delete records.

STEP 1 — BACKUP
Before changing a live database, export/backup your Supabase project data.

STEP 2 — RUN THE SQL
1. Open Supabase project digital-world-marketing.
2. Open SQL Editor -> New query.
3. Open supabase/setup.sql from this repository.
4. Copy the complete SQL file into the SQL Editor and press Run.
5. Confirm the query succeeds before updating the website.

STEP 3 — GITHUB
Upload/replace the repository files while preserving the existing folder structure. Do not remove CNAME, images, CSS, or js/supabase-config.js.

STEP 4 — TEST
1. Open https://www.digitalworldrpa.in/app/dashboard-pro.html and hard refresh (Ctrl+F5).
2. Test adding a draft business first.
3. Edit and save that same business.
4. Create a portfolio and a digital card.
5. Publish only after checking the public portfolio URL.

IMPORTANT
- The SQL uses public.profiles and checks role='super_admin' plus approval_status='approved'.
- Browser code must contain only the Supabase publishable/anon key, never a service_role key.
- RLS controls access. If any table has additional required columns, a constraint or a different column type than the current dashboard expects, SQL may still need a schema-specific adjustment. Do not disable RLS to bypass errors.
- Analytics records page views using first-party events; unique visitor counts are approximate session IDs, not verified human identities. The dashboard currently needs its analytics rendering wired to these events to show full analytics cards.
- Review replies are template-based, not genuine AI-generated replies; do not describe them as AI until a secure server-side model endpoint is connected.
