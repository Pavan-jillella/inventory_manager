import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { planIssue, planLogChange } from './inventory';
import { staffRecord } from './staffRecords';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  getDoc,
  runTransaction,
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
export const manageCloudStaff = async (data) => {
  if (!app) throw new Error('Firebase is not configured.');
  return (await httpsCallable(getFunctions(app), 'manageStaff')(data)).data;
};
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = isFirebaseStorageConfigured ? getStorage(app) : null;
if (storage) storage.maxUploadRetryTime = 60000;

export const issueCloudItems = (cart, details) => runTransaction(db, async transaction => {
  const snapshots = await Promise.all(cart.map(entry => transaction.get(doc(db, 'items', String(entry.item.id)))));
  const plan = planIssue(snapshots.filter(s => s.exists()).map(s => s.data()), cart, details);
  for (const item of plan.updatedItems) transaction.update(doc(db, 'items', String(item.id)), { stock: item.stock });
  for (const log of plan.newLogs) transaction.set(doc(db, 'logs', String(log.id)), log);
  return plan;
});

export const changeCloudLog = (id, updates) => runTransaction(db, async transaction => {
  const logRef = doc(db, 'logs', String(id));
  const snapshot = await transaction.get(logRef);
  if (!snapshot.exists()) throw new Error('Entry no longer exists.');
  const log = snapshot.data();
  const itemRef = doc(db, 'items', String(log.itemId));
  const item = await transaction.get(itemRef);
  const plan = planLogChange(log, item.exists() ? item.data() : null, updates);
  if (plan.updatedItem) transaction.update(itemRef, { stock: plan.updatedItem.stock });
  if (plan.updatedLog) transaction.set(logRef, plan.updatedLog);
  else transaction.delete(logRef);
  return plan;
});

export const readCollection = async (name) => {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((d) => name === 'users' ? staffRecord(d.id, d.data()) : d.data());
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
  const ext = fileOrBlob.type?.split('/')?.[1] || 'jpg';
  const fileName = `products/${Date.now()}_${Math.floor(Math.random() * 100000)}.${ext}`;
  const fileRef = ref(storage, fileName);
  
  const task = uploadBytesResumable(fileRef, fileOrBlob, {
    contentType: fileOrBlob.type || 'image/jpeg',
  });

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (typeof onProgress === 'function') onProgress(progress);
      },
      (error) => {
        console.error('Storage upload failed:', error);
        reject(error);
      },
      async () => {
        try { resolve(await getDownloadURL(fileRef)); }
        catch (error) { reject(error); }
      }
    );
  });
};
