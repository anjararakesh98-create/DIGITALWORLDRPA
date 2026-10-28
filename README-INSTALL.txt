Digital World Marketing OS — V2 Dashboard Starter

Files:
- app/dashboard.html
- app/dashboard-pro.css
- app/dashboard-pro.js

GitHub install:
1. Open https://github.com/anjararakesh98-create/digital-world-ai-marketing-os
2. Back up the current app/dashboard.html before replacing.
3. Upload dashboard.html, dashboard-pro.css and dashboard-pro.js into the existing app/ folder. Keep js/supabase-config.js and all other public site files.
4. Commit changes, wait for GitHub Pages deployment, then open https://www.digitalworldrpa.in/app/dashboard.html.

Included:
- Business list with View / Edit / Delete and Add.
- Portfolio list with Add / Edit / Delete.
- Digital card list with Add / Edit / Delete.
- Review draft template and save attempt.
- Overview counts and navigation.

Important:
- This version uses the existing Supabase tables and assumes business columns: business_name, slug, category, phone, website, google_review_url, short_description, services. Portfolio/card items assume business_id, title, url, description. Review draft save assumes business_id, review_text, draft_text, language, tone. If your real schema differs, a visible error will appear and the payload must be matched to your schema.
- It does not automatically deduplicate existing business records. Review the two Digital World rows first, then delete only the duplicate after verifying its ID and associated data.
- Real-time cross-module updates depend on a common business_id foreign key and compatible table schemas. This UI loads records on page load; realtime subscriptions and public portfolio/card rendering are additional work.
- Real visitor/online analytics requires GA4 or first-party tracking. No fake visitor counts are shown.
- AI replies need a secure backend/Edge Function. Never put private AI API keys or Supabase service_role keys in browser JS.
