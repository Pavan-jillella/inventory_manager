# Inventory Manager

Inventory and issue-tracking app for hotel front desk and admin operations.

## Stack

- React + Vite
- Firebase Firestore (data)
- Firebase Storage (product images)
- LocalStorage fallback (offline/dev without Firebase)

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
If Firebase is not configured, the app continues to run on LocalStorage.

## Firestore Collections

- `items` (document id = item id)
- `users` (document id = user id)
- `logs` (document id = log id)
- `settings/app` (single document)

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```
