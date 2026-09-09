# Production release — September 9, 2026

Website: https://cisshop.vercel.app

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
