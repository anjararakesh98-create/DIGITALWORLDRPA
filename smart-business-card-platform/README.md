# Digital World Smart Business Card Platform

This app lives only in the `smart-business-card-platform` branch and `smart-business-card-platform/` folder. The live Digital World website's `main` branch has not been changed.

## Confirmed product rules
- Free trial: **7 days**.
- ₹299 plan: digital card only, no physical NFC; 5-year validity after verified payment.
- ₹499 plan: one physical NFC card; ₹59 shipping; total payment ₹558; 5-year validity after verified payment.
- Customer submits UPI UTR/reference after QR payment. The owner/admin must manually verify settlement before activation.
- UTR submission never activates paid access.
- Supabase Auth email confirmation remains disabled as configured by the owner.

## Implemented in this branch
- Supabase Auth sign-up and login.
- Customer profile and business-card creation.
- Cloud-saved business profile and card content.
- Products, services, gallery and portfolio entries.
- Logo and cover image upload to the existing `client-card-assets` bucket.
- Public digital card, share URL and generated QR code.
- Public lead capture and owner lead inbox.
- Public card view/call/WhatsApp/email/website/map analytics.
- Payment UTR submission, configurable UPI/QR settings, admin manual approval/rejection.
- Atomic server-side payment verification and five-year activation.
- Admin card status controls and user-role management.
- RLS policies and database guards for customer ownership, payment verification and privileged role changes.

## Backend
Supabase project: `lvbesvjeiaxudhsajyuc`.
The existing database was extended with `business_card_leads`, `business_card_analytics`, and `business_card_platform_settings`. RLS is enabled for these tables. Customer profile role self-service is restricted to `customer`; only admins can manage elevated roles.

## Before public launch
1. Configure the official UPI ID, payment QR image URL and support phone in Admin Dashboard.
2. Verify the existing Super Admin can log in and access Admin Dashboard.
3. Run the manual test checklist in `TESTING.md` using separate customer and admin accounts.
4. Configure a separate hosting target/domain for this platform. Do not publish this branch over the main Digital World website.
5. Test the deployed public-card URL, mobile layouts, image upload limits, RLS boundaries and real UPI payment reconciliation.

## Security notes
- Never put a Supabase service-role key in this frontend. The app uses only the public publishable key.
- Client updates to card profile data cannot change plan, trial, activation or validity fields.
- Admin payment approval uses a server-side transaction; payment and card activation succeed or roll back together.
- Public card visibility is limited by the existing active/unexpired-trial policy.
