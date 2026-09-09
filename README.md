# Inventory Manager

Inventory and issue-tracking app for hotel front desk and admin operations.

## Stack

- React + Vite
- Firebase Firestore (data)
- Firebase Storage (product images)
- Firebase Authentication (email/password sign-in)
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
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

When Firebase is configured, app data syncs to Firestore and product uploads go to Storage.
Local development without Firebase uses demonstration accounts and browser storage. Production deliberately requires Firebase Authentication; demonstration credentials are excluded from production builds.

## Production rollout requirements

Do not deploy this branch over the existing site until the authentication migration is complete. Existing username/password documents alone do not satisfy Firebase Authentication.

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

The report recipients, local delivery time, and time zone are editable in Admin → Settings. Delivery runs every five minutes and sends at the selected local time for the previous calendar day, with a daily idempotency record to prevent duplicates. Gmail requires 2-Step Verification and an App Password; Google shows an App Password only once, and it should never be placed in source code or chat. Store the SMTP values as Firebase Functions secrets:

```sh
firebase functions:secrets:set REPORT_EMAIL_SMTP_HOST   # smtp.gmail.com
firebase functions:secrets:set REPORT_EMAIL_SMTP_PORT   # 587
firebase functions:secrets:set REPORT_EMAIL_SMTP_USER   # sender address
firebase functions:secrets:set REPORT_EMAIL_SMTP_PASS   # Gmail App Password
firebase functions:secrets:set REPORT_EMAIL_FROM        # sender address
firebase deploy --project country-inn-suites --only functions:sendDailyShiftReport
```

The first two commands may require enabling Secret Manager. Configure recipients in Settings, turn on Enable daily report, save, then verify the first delivery. The sender and recipients can be changed later without changing application code.

The local build, lint, and 20 automated tests pass. Browser checks covered all four operations pages, stock overuse rejection, persistence, expense correction, CSV preview/edit/import, mobile navigation, image upload, and recoverable trip deletion. Authenticated cloud checks with two separate sessions are required before promoting a new release. Local demonstration records do not automatically migrate to Firestore.

## Firestore Collections

- `items` (document id = item id)
- `users` (document id = user id)
- `logs` (document id = log id)
- `settings/app` (single document)
- `ops_supplies/{id}` (breakfast and housekeeping supplies)
- `ops_days/{YYYY-MM-DD}` (daily usage, trips, odometer readings, and expenses)

### Automated Daily Email Reports (7:00 AM)

The admin Settings page now supports:
- Enabling/disabling daily reports
- Recipients list (comma-separated)
- Schedule time and timezone metadata

For actual automatic email delivery, deploy Firebase Functions:

1. Install Firebase CLI and login.
2. Configure SMTP secrets for Functions:

```bash
firebase functions:secrets:set REPORT_EMAIL_SMTP_HOST
firebase functions:secrets:set REPORT_EMAIL_SMTP_PORT
firebase functions:secrets:set REPORT_EMAIL_SMTP_USER
firebase functions:secrets:set REPORT_EMAIL_SMTP_PASS
firebase functions:secrets:set REPORT_EMAIL_FROM
```

3. Install function deps and deploy:

```bash
cd functions
npm install
npm run deploy
```

The scheduled function sends a combined CSV report for Morning, Afternoon, and Night shifts at 7:00 AM daily.

## Commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```
