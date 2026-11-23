# Digital World Smart Business Card Platform

This branch isolates the Smart Business Card Platform from the live Digital World website.

## Confirmed product rules
- Free trial: **7 days** (keep the existing approved duration).
- ₹299 plan: no physical NFC card; 5-year validity.
- ₹499 plan: one physical NFC card; 5-year validity; ₹59 shipping.
- Payment: QR payment, customer submits UTR/reference, owner manually verifies and approves.
- Email confirmation is disabled in Supabase Auth by the owner; new signups can authenticate without an email-confirmation link.
- Do not auto-activate paid access on signup or on UTR submission. Owner approval is required.

## Backend
Supabase project: `lvbesvjeiaxudhsajyuc`.

The existing schema contains `user_profiles`, `business_cards`, `business_card_payments`, and related order/payment tables. RLS is enabled on the public tables.

## Important
This branch does not change the live website's `main` branch. The app must be connected to Supabase and tested before being considered production-ready.
