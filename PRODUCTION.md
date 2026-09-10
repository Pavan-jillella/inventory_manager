# Production release — September 9, 2026

Website: https://cisshop.vercel.app

## Visualization update — September 10

Donut charts now show stock/category shares, monthly expense categories and the breakfast served/wasted/unclassified mix for one item. Product details include a clickable 30-day usage calendar, with exact dates and quantities available by keyboard or in a data table. Monthly card budgets use a circular indicator that retains the true percentage above 100%. Shuttle mileage uses a shaded area chart while retaining gaps for incomplete readings. Empty and zero-budget states do not invent percentages or activity.

Checked populated donuts, over-budget display and heatmap date selection in the local demo. Mobile heatmap and breakfast charts fit a 390-pixel viewport without document or dialog overflow. No production records were changed for these visualization checks. Existing receipt round-trip and multi-device acceptance checks below still apply.

## Analytics and operations additions — September 9

- Inventory product photos/names open a detail window with larger imagery, 30-day issue charts, recent product edits and recorded stock transitions. Historical edits from before this release cannot be reconstructed. Product edit history is append-only from the client; administrators can read it.
- Restocking estimates require at least seven calendar days of observation and issues on three different days within the latest 30 days. Estimates use recorded issues only and are not demand guarantees.
- Dashboard Today/7-day/30-day/custom filters apply to sales, issue counts and shift performance, with equal-length previous-period comparisons. Custom dates use Apply dates. Current-stock cards remain explicitly labeled as current snapshots. Reporting dates follow the browser's local time.
- Breakfast supports Served and Wasted stock deductions, daily guest counts, per-item weekly charts and served quantity per guest. Older Used entries remain unclassified; quantities from different items are not combined.
- Shuttle includes a daily timeline, weekly mileage and missing/open odometer reminders. Missing completed readings appear as chart gaps.
- Card expenses support JPEG/PNG/WebP/PDF receipts up to 5 MB, monthly administrator budgets and category/vendor charts. Receipts use authenticated SDK downloads rather than public download links. See [Firebase's download documentation](https://firebase.google.com/docs/storage/web/download-files#download_data_directly_from_the_sdk).
- Product edits preserve stock changed concurrently on another device unless a stock correction is explicitly made from the current value.

Validation: 56 automated tests, lint and production build; browser checks for product details, mobile dashboard layout, preset/custom comparison dates, breakfast served/waste stock changes, guest counts and local budget saving. Firestore and Storage rules compiled and were deployed after explicit approval of the access scope. The bucket already permits browser GET requests. A live receipt upload/download round trip and Front Desk multi-device writes remain acceptance checks; no real hotel expense was created for testing. Build output still includes a large-chunk performance warning. Firebase emulator rule tests were unavailable because this machine has no Java runtime.

## Released

- Updated operations, inventory, issue-item, activity, and administration dashboards.
- Firebase staff username/email accounts, administrator password resets, and self-profile editing.
- Product image processing, retry controls, visible upload failures, and correctly configured Firebase Storage role checks.
- Cloud-load error handling, signed-out access restrictions, and cloud full-reset protection.
- Configurable email recipients, local delivery time, and time zone; reporting backend code and secure setup script.
- Patched frontend and backend dependencies, Node.js 22 functions, and security headers.

## Verified

- 39 automated tests; lint and production build passed.
- npm audits reported zero known vulnerabilities in the frontend and both backend dependency sets at release time.
- All 14 application routes rendered locally at desktop and 390-pixel mobile widths without document overflow.
- Administrator sign-in and cloud reads succeeded in the existing live site and new preview. Updated administration and operations pages were checked against Firebase.
- A real product-editor image upload to Firebase Storage succeeded and its preview loaded. The test used the public hotel logo; no test product or activity record was added. One unused uploaded logo remains in Storage.
- Signed-out callable access returned 401 using a request with no action; signed-out inventory reads returned 403.
- Main production page returned HTTP 200 with the configured security headers after release.

## Recovery configuration

Firestore database deletion protection is enabled. A daily backup schedule retains snapshots for seven days (Firebase backup-storage charges apply). The first scheduled backup and restoration have not yet been verified. PITR remains disabled. This schedule covers Firestore, not image objects or Firebase Authentication accounts.

The Storage service agent requires `roles/firebaserules.firestoreServiceAgent` to evaluate administrator roles in Firestore. That role was missing and was enabled during this release. Firebase CLI 14 can skip this check in non-interactive deployments or when rules are unchanged. See https://firebase.google.com/docs/storage/security/rules-conditions#enhance_with_firestore.

## Remaining activation and acceptance checks

1. Gmail: run `bash scripts/setup-gmail-reports.sh` locally and enter the Gmail App Password at the hidden prompt. The script verifies SMTP without sending mail, stores secrets in Firebase, and deploys the scheduler. Then set recipients/time in Admin → Settings, enable the report, save, and verify delivery. No SMTP credential was supplied during this release, and the email function is not yet deployed.
2. Existing legacy staff profiles are not automatically working Authentication accounts. Create required staff accounts in Admin → Staff. Live Front Desk sign-in, real account creation/password-reset acceptance, and simultaneous writes from two staff devices remain unverified; authorization/provisioning behavior was tested with mocked backend dependencies.
3. Verify the first backup and a restoration in a separate database before relying on the recovery process. Configure image-object and Authentication recovery according to hotel retention requirements.
4. Firebase reported a missing Artifact Registry cleanup policy after successfully deploying the staff function. This does not prevent the function from running, but old function build images may accumulate storage costs.

No email was sent and no hotel inventory/activity records were deleted during these release checks. An account-creation access probe was blocked by automatic approval review; a non-mutating probe was used instead.
