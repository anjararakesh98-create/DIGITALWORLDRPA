# Digital World Marketing OS — Dashboard Starter

This is a safer additive dashboard starter for the existing GitHub Pages website. It does not replace `index.html`, the existing logo, or the public portfolio.

## Files
- `app/dashboard.html` — dashboard layout
- `app/dashboard-pro.css` — responsive dashboard styles
- `app/dashboard-pro.js` — Supabase auth, basic table counts, business listing, add-business modal, and starter review templates

## Install in GitHub (web UI)
1. Open the existing repository: `https://github.com/anjararakesh98-create/digital-world-ai-marketing-os`
2. Open the `app` folder.
3. Add `dashboard-pro.css` and `dashboard-pro.js` as new files, copying the files from this ZIP.
4. Before replacing `app/dashboard.html`, download/save the current file as a backup.
5. Replace `app/dashboard.html` with this ZIP's `app/dashboard.html`.
6. Keep `js/supabase-config.js` in place. The page expects it at `../js/supabase-config.js`.
7. Commit the changes, wait for GitHub Pages to publish, then open `https://www.digitalworldrpa.in/app/dashboard.html`.

## Important integration notes
- The UI expects the existing Supabase tables: `profiles`, `businesses`, `portfolios`, `digital_cards`, and `review_drafts`.
- The add-business form uses columns `business_name`, `slug`, `category`, `phone`, `website`, `google_review_url`, `short_description`, and `services`. If your actual `businesses` table uses different column names/types, the save operation will show the database error; adjust the payload to match the actual schema.
- This starter uses a template-based review draft, not an AI model yet. A real AI integration must run through a secure backend/Edge Function; never expose an AI secret in browser code.
- Website visitor analytics currently clearly shows “not connected”. To show actual visitors, online users, popular pages and traffic sources, connect GA4 or implement first-party tracking with a defined event schema and consent/privacy behavior. The decorative chart is only a visual placeholder, not real data.
- Some portfolio/card management sections are scaffolds. They must be connected to the actual table schemas before production use.
- Do not put a Supabase `service_role` key or Google OAuth client secret into any public JavaScript file.
- After deployment, verify Supabase Auth URL Configuration includes `https://www.digitalworldrpa.in/app/dashboard.html` and Site URL `https://www.digitalworldrpa.in`.
