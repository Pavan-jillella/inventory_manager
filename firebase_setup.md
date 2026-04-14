# Firebase Setup Notes

Use these starter rules for development. Tighten them before production use.

## Firestore rules (starter)

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Storage rules (starter)

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## Recommended production direction

- Use Firebase Authentication.
- Restrict write access by user role.
- Allow public read for product images only if needed.
- Add rate limits and data validation in Security Rules.
