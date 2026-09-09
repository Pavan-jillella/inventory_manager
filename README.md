# Inventory Manager

Inventory and issue-tracking app for hotel front desk and admin operations.

See [PRODUCTION.md](PRODUCTION.md) for the verified deployment state, backup configuration, and remaining email/staff acceptance steps.

## Stack

- React + Vite
- Firebase Firestore (data)
- Firebase Storage (product images)
- Firebase Authentication (staff username/password or email/password sign-in)
- LocalStorage demonstration mode during local development only

## Hotel operations

- `/operations/shuttle`: room, pick/drop, scheduled time, trip status, and daily vehicle odometer readings.
- `/operations/breakfast`: stock, morning usage, receipts, stock corrections, and low-stock flags.
- `/operations/housekeeping`: supplies, usage, receipts, and stock corrections.
- `/operations/expenses`: daily credit-card expenses and totals; card details are limited to the last four digits.
- Inventory accepts CSV, TSV, and JSON files (2 MB / 500 rows maximum), with an editable preview before import. Download the CSV template in the app. Excel and PDF tables must currently be exported to CSV first.
- Product images accept JPEG, PNG, and WebP, up to 10 MB. Images are resized proportionally and displayed without cropping.
- Daily CSV exports are available in each operations section. Inventory issue and activity correction writes use Firestore transactions.

## Firebase Setup

1. Create a Firebase project.
2. Enable Firestore Database.
3. Enable Storage.
4. Add a Web App in Firebase and copy config values.
5. Create a `.env.local` file and add:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=copy_the_exact_bucket_from_firebase
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

When Firebase is configured, app data syncs to Firestore and product uploads go to Storage.
Local development without Firebase uses demonstration accounts and browser storage. Production deliberately requires Firebase Authentication; demonstration credentials are excluded from production builds.

## Production rollout requirements

Existing username/password documents alone do not satisfy Firebase Authentication. Each active staff member needs an Authentication account linked to a `users/{authUid}` profile. Admin → Staff creates this link automatically for new username or email accounts. Passwords are stored only by Firebase Authentication. Administrators can reset staff passwords through Edit account; email accounts also support a reset email from My profile.

1. Authenticate the Firebase CLI to the existing hotel project and back up its data.
2. Enable the email/password provider in Firebase Authentication and add the production domain to its authorized domains.
3. Provision existing staff in Firebase Authentication. Create a matching `users/{authUid}` profile containing `id`, `name`, `username` (email), and `role` (`Admin` or `Front Desk`). Never include passwords in these profiles. Confirm an administrator can sign in before switching production.
4. Deploy `firestore.rules`, `storage.rules`, and the `manageStaff` callable function. Staff management has its own Node.js 22 codebase so it can deploy without configuring optional SMTP reports:

   ```sh
   npm ci --prefix functions-staff
   firebase deploy --config firebase.staff.json --project country-inn-suites --only firestore:rules,storage,functions:staff
   ```

   The staff page requires that function, and cloud resets must not remove the last administrator. The separate `functions` codebase contains optional email reports and still requires its SMTP secrets.
5. Verify signed-out access is denied, both staff roles can perform their permitted workflows, and two devices see the same saved inventory and daily records.
6. Run `npm ci`, `npm run lint`, `npm test`, and `npm run build`. Deploy to a Vercel preview using the existing project settings, verify sign-in and cloud saves there, and only then promote to production.

### Daily email reports

The report recipients (up to 20), local delivery time, and time zone are editable in Admin → Settings. Delivery checks every five minutes and sends after the selected local time for the previous calendar day, with a daily claim to prevent duplicate attempts. Reports contain inventory issue logs and revenue by shift; operations records have separate CSV exports in the website.

Gmail requires 2-Step Verification and an App Password. Never place that password in source code or chat. The setup script prompts without showing the password, verifies the Gmail connection without sending a message, stores the credentials in Firebase Secret Manager, and deploys the reporting function:

```sh
bash scripts/setup-gmail-reports.sh
```

For another SMTP provider, configure these secrets directly:

```sh
firebase functions:secrets:set REPORT_EMAIL_SMTP_HOST --project country-inn-suites
firebase functions:secrets:set REPORT_EMAIL_SMTP_PORT --project country-inn-suites
firebase functions:secrets:set REPORT_EMAIL_SMTP_USER --project country-inn-suites
firebase functions:secrets:set REPORT_EMAIL_SMTP_PASS --project country-inn-suites
firebase functions:secrets:set REPORT_EMAIL_FROM --project country-inn-suites
firebase deploy --config firebase.reports.json --project country-inn-suites --only functions
```

The project needs billing, Secret Manager, and Cloud Scheduler enabled. Configure recipients in Settings, turn on Enable daily report, save, then verify the first delivery. The sender can be changed by rerunning the setup and deploying; recipients/time can be changed in Settings without redeployment.

If SMTP fails, rejects a recipient, or delivery is uncertain, the date is marked `needs-review` and is not automatically retried. A process interruption can leave `sending`. Inspect Function logs and `report_deliveries/{date}` and verify delivery with the provider before considering another attempt. This avoids automatically sending duplicate reports. Failed deliveries are visible in Settings.

### Shared records and recovery

With Firebase configured, inventory, activity, settings, and daily operations are stored in Firestore and images in Cloud Storage. Clearing browser cookies/history signs a user out but does not delete these records. Local demonstration records stay in that browser and do not automatically migrate. The app blocks operational screens when the initial cloud read fails and reports later synchronization errors; shared inventory refreshes every 45 seconds and operations use live listeners.

Cloud storage persists beyond a browser session, but it is not a backup. Configure Firestore scheduled backups/PITR and Cloud Storage recovery/retention in Google Cloud for the hotel's retention requirements, and test restoration separately. CSV exports are useful working copies. Full reset is disabled in cloud mode; deliberate administrator deletions still require a recovery plan.

### Release checks

Run lint, unit tests, production build, and npm audit for the root app and both function directories. Tests cover inventory transactions, stock validation, imports, recoverable trip deletion, staff authorization/provisioning, report date boundaries, recipient validation, and duplicate/failed delivery handling. Complete authenticated browser checks with two sessions for shared updates, both roles, and uploaded images before hotel-wide rollout.

Both functions use Node.js 22 and modular Firebase Admin APIs. Targeted `uuid` overrides update the CommonJS-compatible `v4()` API used by gaxios/teeny-request to the patched version; revisit these overrides when Google Cloud Storage updates its dependency chain.

## Firestore Collections

- `items` (document id = item id)
- `users` (document id = user id)
- `logs` (document id = log id)
- `settings/app` (single document)
- `ops_supplies/{id}` (breakfast and housekeeping supplies)
- `ops_days/{YYYY-MM-DD}` (daily usage, trips, odometer readings, and expenses)

## Commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```
