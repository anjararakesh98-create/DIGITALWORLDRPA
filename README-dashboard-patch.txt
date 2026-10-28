DIGITAL WORLD MARKETING OS — DASHBOARD PATCH

Files:
- dashboard-pro.html  -> upload to your repository as app/dashboard-pro.html
- dashboard-pro.js    -> upload to your repository as app/dashboard-pro.js

Before replacing files:
1. In GitHub, open your repository and the app folder.
2. Download/keep a backup of the current dashboard-pro.html and dashboard-pro.js.
3. Upload these two files into app/ and confirm replacement of the same filenames.
4. Keep dashboard-pro.css and js/supabase-config.js unchanged.
5. Open the dashboard and test Add/Edit/Delete on a test business first.

Important:
- The JS maps the existing Business form names to the known businesses schema (name, slug, category, description, phone, email, website, address, google_review_url, services).
- Portfolio mapping uses: business_id, headline, about, services, gallery, social_links, seo_title, seo_description, is_published.
- Digital card mapping uses: business_id, person_name, designation, phone, whatsapp, email, website, address, photo_url, theme, is_published.
- This patch does not alter Supabase tables or delete existing database data.
- Confirm that your Supabase RLS policies allow the signed-in approved super_admin to insert/update/delete rows.
- Review assistant is still a starter template, not a connected AI model. Website analytics still needs a real analytics integration.
- If your actual businesses table differs from the listed fields, Supabase will show a column error; do not run SQL that drops data. Share the exact error text for a targeted fix.
