# Digital World — Website & Service Store

Digital World public website and service-order system.

Live website: https://www.digitalworldrpa.in/

## Public pages
- `index.html` — main website, service overview, contact links and SEO metadata
- `store.html` — public Service Store catalogue and service-request form
- `css/style.css` — main website styles
- `css/service-store.css` — Service Store and shared admin styles
- `css/admin.css` — restricted Admin Panel styles
- `images/` — website and brand assets
- `js/google-ads-conversions.js` — Google Ads contact-click conversion tracking
- `js/service-store.js` — public catalogue, order intake, UPI QR and UTR submission
- `js/admin.js` — authenticated order and payment administration
- `robots.txt`, `sitemap.xml` and `CNAME` — search and custom-domain configuration

## Service Store backend
The Service Store uses Supabase for the service catalogue, packages, order requests, UPI payment references and package-access records.

- Customers can submit a service request without creating a website login.
- Customers pay manually using the displayed UPI QR / UPI ID and submit their UTR reference.
- **Payments are never verified automatically.** An authorised Digital World admin must independently match the credit in the PhonePe / bank account and then approve it in the Admin Panel.
- Package access is granted only after that manual admin approval.
- Monthly packages are manually renewed; there are no automatic recurring deductions.
- The Admin Panel is at `admin.html` and requires an authorised admin or super-admin account.

## Development checks
GitHub Actions runs JavaScript syntax checks and verifies the required HTML pages and local assets.
