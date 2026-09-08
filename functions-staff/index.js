const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
// Staff credentials stay in Firebase Authentication, never in Firestore.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
exports.manageStaff = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  const caller = await db.collection('users').doc(request.auth.uid).get();
  if (caller.data()?.role !== 'Admin') throw new HttpsError('permission-denied', 'Administrator access required.');
  const { action, name, email, password, role, uid } = request.data || {};
  if (action === 'create') {
    if (typeof name !== 'string' || !name.trim() || name.length > 100 || typeof email !== 'string' || !email.includes('@') || typeof password !== 'string' || password.length < 12 || !['Admin', 'Front Desk'].includes(role)) throw new HttpsError('invalid-argument', 'Provide a name, email, password of at least 12 characters, and staff role.');
    const user = await admin.auth().createUser({ email: email.trim().toLowerCase(), password, displayName: name.trim() });
    const profile = { id: user.uid, name: name.trim(), username: user.email, role };
    try { await db.collection('users').doc(user.uid).set(profile); }
    catch (error) { await admin.auth().deleteUser(user.uid); throw error; }
    return profile;
  }
  if (action === 'remove') {
    if (typeof uid !== 'string' || uid === request.auth.uid) throw new HttpsError('invalid-argument', 'You cannot remove your own account.');
    await admin.auth().updateUser(uid, { disabled: true });
    await admin.auth().revokeRefreshTokens(uid);
    await db.collection('users').doc(uid).delete();
    return { removed: true };
  }
  throw new HttpsError('invalid-argument', 'Unknown staff action.');
});
