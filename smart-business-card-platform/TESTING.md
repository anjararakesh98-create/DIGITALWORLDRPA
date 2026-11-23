# Smart Business Card Platform — Test Checklist

Status: static implementation and database policy checks have been run. Real browser/auth/payment end-to-end tests still require separate test accounts and a deployed preview URL.

## Automated/static checks already run
- JavaScript source parses successfully with the JavaScript Function parser.
- Supabase schema includes the 7-day `trial_ends_at` default.
- RLS policies exist for card leads, analytics, payment settings, user profiles, cards and payments.
- Business-card client-update trigger protects plan/trial/activation/validity columns.
- Role-change trigger protects Super Admin assignment and prevents removal of the last Super Admin.
- Atomic admin payment-verification RPC exists.
- Existing public image bucket is limited to PNG/JPEG/WebP and 5 MB.

## Manual end-to-end tests still required
1. Sign up a fresh customer account with email confirmation disabled.
2. Confirm a single business card is created with a seven-day trial and selected plan.
3. Log out and log in again; verify customer data persists.
4. Save profile details; upload a logo and cover; verify the public URLs load.
5. Add/edit/remove Products, Services, Gallery and Portfolio entries; reload and verify cloud persistence.
6. Open the QR/share URL in a private browser; verify the public card displays only while active or in an unexpired trial.
7. Submit a public lead; verify it appears only in the card owner's lead inbox and Admin view.
8. Verify public card views and contact-link clicks appear in Analytics.
9. Submit a valid UTR for ₹299 and separately for ₹558; verify each remains pending until Admin approval.
10. Confirm an incorrect/duplicate or rejected payment does not activate the card.
11. Verify a pending payment from Admin; confirm card becomes active and valid for five years.
12. Verify customer cannot change `card_status`, `plan_code`, `trial_ends_at`, `activated_at` or `valid_until` directly.
13. Verify a customer cannot read another customer's leads, analytics, payment rows or profile.
14. Verify Admin can suspend/restore eligible cards and assign Customer/Admin roles; only Super Admin can assign Super Admin.
15. Test desktop and Android/mobile viewport, QR scan and all external links.

## Launch blockers
- Official UPI ID and QR image URL must be entered in Admin Dashboard.
- Browser-based end-to-end tests and real payment reconciliation have not yet been performed.
- A separate hosting target/domain must be configured; the live main website must remain untouched.
