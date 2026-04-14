import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.authDomain) &&
  Boolean(firebaseConfig.projectId);

export const isFirebaseStorageConfigured = isFirebaseConfigured && Boolean(firebaseConfig.storageBucket);

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;
export const storage = isFirebaseStorageConfigured ? getStorage(app) : null;

export const readCollection = async (name) => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((d) => d.data());
};

export const upsertManyDocs = async (name, docs, idField = 'id') => {
  if (!db || !Array.isArray(docs) || docs.length === 0) return;
  const batch = writeBatch(db);
  docs.forEach((entry) => {
    const idValue = entry?.[idField];
    if (idValue === undefined || idValue === null) return;
    batch.set(doc(db, name, String(idValue)), entry, { merge: true });
  });
  await batch.commit();
};

export const upsertDocById = async (name, id, data) => {
  if (!db || id === undefined || id === null) return;
  await setDoc(doc(db, name, String(id)), data, { merge: true });
};

export const deleteDocById = async (name, id) => {
  if (!db || id === undefined || id === null) return;
  await deleteDoc(doc(db, name, String(id)));
};

export const deleteManyDocsByIds = async (name, ids = []) => {
  if (!db || !Array.isArray(ids) || ids.length === 0) return;
  for (let i = 0; i < ids.length; i += 500) {
    const batch = writeBatch(db);
    ids.slice(i, i + 500).forEach((id) => {
      if (id === undefined || id === null) return;
      batch.delete(doc(db, name, String(id)));
    });
    await batch.commit();
  }
};

export const readSettings = async () => {
  if (!db) return null;
  const snapshot = await getDoc(doc(db, 'settings', 'app'));
  if (!snapshot.exists()) return null;
  return snapshot.data();
};

export const writeSettings = async (settings) => {
  if (!db) return;
  await setDoc(doc(db, 'settings', 'app'), settings, { merge: true });
};

export const uploadProductImage = async (fileOrBlob, onProgress) => {
  if (!storage || !fileOrBlob) return null;
  const ext = fileOrBlob.type?.includes('png') ? 'png' : 'jpg';
  const fileName = `${Date.now()}_${Math.floor(Math.random() * 100000)}.${ext}`;
  const fileRef = ref(storage, `products/${fileName}`);
  const task = uploadBytesResumable(fileRef, fileOrBlob, {
    contentType: fileOrBlob.type || 'image/jpeg',
    cacheControl: 'public,max-age=31536000,immutable',
  });
  await new Promise((resolve, reject) => {
    task.on('state_changed', (snapshot) => {
      if (typeof onProgress === 'function' && snapshot.totalBytes > 0) {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(pct);
      }
    }, reject, resolve);
  });
  return getDownloadURL(fileRef);
};
